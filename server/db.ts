import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  studioBookings,
  studioServices,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
  values: { price: string; isActive: boolean },
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
  scheduledAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(studioBookings).values({
    ...values,
    notes: values.notes || null,
  });
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
    })
    .from(studioBookings)
    .innerJoin(studioServices, eq(studioBookings.serviceId, studioServices.id))
    .orderBy(desc(studioBookings.scheduledAt));
}

export async function updateStudioBookingStatus(
  id: number,
  status: "requested" | "confirmed" | "completed" | "cancelled",
) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(studioBookings).set({ status }).where(eq(studioBookings.id, id));
}
