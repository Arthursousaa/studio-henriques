import { and, asc, desc, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  studioAvailabilitySlots,
  studioBookings,
  studioServices,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { generateAvailabilitySlots, type AvailabilityGenerationInput } from "../shared/availabilityGenerator";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

const initialStudioServices = [
  {
    slug: "manicure",
    name: "Manicure",
    category: "Unhas",
    description: "Cuidado delicado para unhas e cutículas, com acabamento impecável.",
    price: "0.00",
    sortOrder: 1,
  },
  {
    slug: "pedicure",
    name: "Pedicure",
    category: "Unhas",
    description: "Pés bem cuidados para uma sensação leve e renovada.",
    price: "0.00",
    sortOrder: 2,
  },
  {
    slug: "alongamentos",
    name: "Alongamentos",
    category: "Unhas",
    description: "Alongamentos personalizados para valorizar o seu estilo.",
    price: "0.00",
    sortOrder: 3,
  },
  {
    slug: "sobrancelhas",
    name: "Sobrancelhas",
    category: "Olhar",
    description: "Design cuidadoso, respeitando os traços naturais do seu rosto.",
    price: "0.00",
    sortOrder: 4,
  },
  {
    slug: "depilacao",
    name: "Depilação",
    category: "Bem-estar",
    description: "Atendimento com atenção ao conforto e aos detalhes.",
    price: "0.00",
    sortOrder: 5,
  },
  {
    slug: "massagem",
    name: "Massagem",
    category: "Bem-estar",
    description: "Um momento reservado para desacelerar e cuidar de você.",
    price: "0.00",
    sortOrder: 6,
  },
] as const;

export async function ensureStudioServices() {
  const db = await getDb();
  if (!db) return;

  for (const service of initialStudioServices) {
    await db
      .insert(studioServices)
      .values(service)
      .onDuplicateKeyUpdate({ set: { slug: service.slug } });
  }
}

export async function listStudioServices(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  await ensureStudioServices();

  const query = db.select().from(studioServices);
  if (includeInactive) {
    return query.orderBy(asc(studioServices.sortOrder));
  }
  return query
    .where(eq(studioServices.isActive, true))
    .orderBy(asc(studioServices.sortOrder));
}

export async function getStudioService(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  await ensureStudioServices();
  const result = await db
    .select()
    .from(studioServices)
    .where(eq(studioServices.id, id))
    .limit(1);
  return result[0];
}

export async function updateStudioService(
  id: number,
  values: { price: string; isPriceOnRequest: boolean; isActive: boolean },
) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(studioServices).set(values).where(eq(studioServices.id, id));
}

export async function createStudioBooking(values: {
  serviceId: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(studioBookings).values({
    ...values,
    notes: values.notes || null,
  });
}

type AvailabilityStatus = "available" | "blocked" | "booked";

export async function listStudioAvailability() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studioAvailabilitySlots).orderBy(asc(studioAvailabilitySlots.slotDate), asc(studioAvailabilitySlots.startTime));
}

export async function listAvailableStudioDates() {
  const slots = await listStudioAvailability();
  return Array.from(new Set(slots.filter(slot => slot.status === "available").map(slot => slot.slotDate)));
}

export async function listAvailableStudioAvailabilityForDate(slotDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studioAvailabilitySlots)
    .where(and(eq(studioAvailabilitySlots.slotDate, slotDate), eq(studioAvailabilitySlots.status, "available")))
    .orderBy(asc(studioAvailabilitySlots.startTime));
}

export async function createStudioAvailability(values: { slotDate: string; startTime: string; endTime: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(studioAvailabilitySlots).values({ ...values, status: "available" });
}

export async function generateStudioAvailability(values: AvailabilityGenerationInput) {
  const slots = generateAvailabilitySlots(values);
  let created = 0;
  for (const slot of slots) {
    try {
      await createStudioAvailability(slot);
      created += 1;
    } catch {
      // Horários que já existem são preservados para permitir gerar períodos sobrepostos sem duplicar a agenda.
    }
  }
  return { created, total: slots.length };
}

export async function closeStudioAvailabilityDate(slotDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(studioAvailabilitySlots)
    .set({ status: "blocked" })
    .where(and(eq(studioAvailabilitySlots.slotDate, slotDate), eq(studioAvailabilitySlots.status, "available")));
}

export async function updateStudioAvailability(id: number, status: Exclude<AvailabilityStatus, "booked">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(studioAvailabilitySlots).set({ status }).where(and(eq(studioAvailabilitySlots.id, id), ne(studioAvailabilitySlots.status, "booked")));
}

export async function deleteStudioAvailability(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.delete(studioAvailabilitySlots).where(and(eq(studioAvailabilitySlots.id, id), ne(studioAvailabilitySlots.status, "booked")));
}

export async function scheduleStudioBooking(values: {
  availabilitySlotId: number;
  serviceId: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const slots = await db.select().from(studioAvailabilitySlots)
    .where(and(eq(studioAvailabilitySlots.id, values.availabilitySlotId), eq(studioAvailabilitySlots.status, "available")))
    .limit(1);
  const slot = slots[0];
  if (!slot) return undefined;
  await db.update(studioAvailabilitySlots).set({ status: "booked" }).where(and(eq(studioAvailabilitySlots.id, values.availabilitySlotId), eq(studioAvailabilitySlots.status, "available")));
  await db.insert(studioBookings).values({
    serviceId: values.serviceId,
    availabilitySlotId: values.availabilitySlotId,
    customerName: values.customerName,
    customerPhone: values.customerPhone,
    notes: values.notes || null,
    scheduledAt: new Date(`${slot.slotDate}T${slot.startTime}:00`),
    status: "confirmed",
  });
  return slot;
}

export async function listStudioBookings() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: studioBookings.id,
      customerName: studioBookings.customerName,
      customerPhone: studioBookings.customerPhone,
      notes: studioBookings.notes,
      scheduledAt: studioBookings.scheduledAt,
      status: studioBookings.status,
      createdAt: studioBookings.createdAt,
      serviceName: studioServices.name,
      slotDate: studioAvailabilitySlots.slotDate,
      startTime: studioAvailabilitySlots.startTime,
      endTime: studioAvailabilitySlots.endTime,
    })
    .from(studioBookings)
    .innerJoin(studioServices, eq(studioBookings.serviceId, studioServices.id))
    .leftJoin(studioAvailabilitySlots, eq(studioBookings.availabilitySlotId, studioAvailabilitySlots.id))
    .orderBy(desc(studioBookings.createdAt));
}

export async function updateStudioBookingStatus(
  id: number,
  status: "requested" | "confirmed" | "completed" | "cancelled",
) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const bookings = await db.select().from(studioBookings).where(eq(studioBookings.id, id)).limit(1);
  const booking = bookings[0];
  if (booking?.availabilitySlotId && booking.status !== status) {
    if (status === "cancelled") {
      await db.update(studioAvailabilitySlots).set({ status: "available" }).where(eq(studioAvailabilitySlots.id, booking.availabilitySlotId));
    } else if (booking.status === "cancelled") {
      await db.update(studioAvailabilitySlots).set({ status: "booked" }).where(and(eq(studioAvailabilitySlots.id, booking.availabilitySlotId), eq(studioAvailabilitySlots.status, "available")));
    }
  }
  await db.update(studioBookings).set({ status }).where(eq(studioBookings.id, id));
}

export async function listStudioUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.lastSignedIn));
}

export async function updateStudioUserRole(id: number, role: "admin" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(users).set({ role }).where(eq(users.id, id));
}
