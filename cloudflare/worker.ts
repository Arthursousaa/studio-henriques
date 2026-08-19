/// <reference types="@cloudflare/workers-types" />

import { TRPCError, initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { SignJWT, jwtVerify } from "jose";
import superjson from "superjson";
import { z } from "zod";
import { generateAvailabilitySlots, withUpcomingAvailabilityPeriod } from "../shared/availabilityGenerator";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SESSION_SECRET: string;
  INITIAL_ADMIN_EMAIL: string;
}

type StudioUser = {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  loginMethod: "password";
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
};

type Context = {
  request: Request;
  env: Env;
  user: StudioUser | null;
  responseHeaders: Headers;
};

const t = initTRPC.context<Context>().create({ transformer: superjson });
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Este painel é reservado às administradoras." });
  }
  return next({ ctx });
});

const SERVICES = [
  ["Manicure", "Unhas", "Corte, lixa, hidratação, cutilagem e aplicação de esmalte.", 25],
  ["Unha postiça", "Unhas", "Preparação da unha natural, aplicação de unha postiça e esmaltação.", 35],
  ["Banho de gel", "Unhas", "Reforço para unhas mais fortes e resistentes.", 60],
  ["Alongamento", "Unhas", "Alongamento com gel, fibra de vidro ou acrílico.", 100],
  ["Pedicure", "Pés", "Corte, lixa, hidratação, cutilagem e esmaltação.", 30],
  ["Spa dos pés", "Pés", "Esfoliação, hidratação profunda, cutilagem e esmaltação.", 35],
  ["Plástica dos pés", "Pés", "Tratamento intensivo com esfoliação e massagem.", 45],
  ["Design de sobrancelhas", "Facial", "Correção e definição do formato das sobrancelhas.", 25],
  ["Design com brow lamination", "Facial", "Alinhamento e definição dos fios.", 45],
  ["Limpeza de pele", "Facial", "Pele mais saudável, luminosa e revitalizada.", 90],
  ["Design com henna", "Facial", "Coloração temporária para realçar o desenho natural.", 35],
  ["Lash lifting", "Facial", "Curvatura natural dos cílios.", 50],
  ["Maquiagem", "Facial", "Personalizada para o dia a dia, eventos ou ocasiões especiais.", null],
  ["Buço", "Depilação", "Remoção delicada dos pelos da região superior dos lábios.", 15],
  ["Axila", "Depilação", "Pele lisa e confortável.", 20],
  ["Abdômen", "Depilação", "Remoção dos pelos e impurezas da região abdominal.", 45],
  ["Meia perna", "Depilação", "Depilação da parte inferior das pernas.", 55],
  ["Braço completo", "Depilação", "Depilação completa dos braços.", 85],
  ["Virilha", "Depilação", "Depilação íntima com técnica segura.", 90],
  ["Perna inteira", "Depilação", "Depilação completa das pernas.", 100],
  ["Drenagem linfática", "Massagens", "Bem-estar e redução da sensação de inchaço.", 70],
  ["Massagem relaxante", "Massagens", "Alívio do estresse e da tensão muscular.", 80],
  ["Massagem com ventosa", "Massagens", "Estimula a circulação e o bem-estar corporal.", 120],
  ["Pacote Bronze", "Pacotes mensais", "2 spas dos pés e 4 manicures. Válido por 30 dias.", 150],
  ["Pacote Prata", "Pacotes mensais", "1 plástica dos pés, 1 spa dos pés e 4 manicures. Válido por 30 dias.", 170],
  ["Pacote Ouro", "Pacotes mensais", "1 plástica dos pés, 1 spa dos pés, 4 manicures e 1 design. Válido por 30 dias.", 190],
  ["Pacote Platina", "Pacotes mensais", "Pacote mensal com unhas, design e depilações. Válido por 30 dias.", 215],
  ["Pacote Diamante", "Pacotes mensais", "Pacote mensal completo com cuidados de unhas, depilação e drenagem. Válido por 30 dias.", 315],
] as const;

type ServiceRow = {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  is_price_on_request: number;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type UserRow = {
  id: number;
  open_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
  last_signed_in: string;
};

type AvailabilitySlotRow = {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: "available" | "blocked" | "booked";
  created_at: string;
  updated_at: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const SESSION_COOKIE = "studio_henriques_session";
const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function encodeBase64(bytes: Uint8Array) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

async function derivePassword(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const digest = await derivePassword(password, salt);
  return `${encodeBase64(salt)}.${encodeBase64(digest)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltPart, digestPart] = stored.split(".");
  if (!saltPart || !digestPart) return false;
  const actual = await derivePassword(password, decodeBase64(saltPart));
  const expected = decodeBase64(digestPart);
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < actual.length; index += 1) mismatch |= actual[index] ^ expected[index];
  return mismatch === 0;
}

function toUser(row: UserRow): StudioUser {
  return {
    id: row.id,
    openId: row.open_id,
    name: row.name,
    email: row.email,
    role: row.role,
    loginMethod: "password",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSignedIn: row.last_signed_in,
  };
}

function toService(row: ServiceRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    price: String(row.price),
    isPriceOnRequest: Boolean(row.is_price_on_request),
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAvailabilitySlot(row: AvailabilitySlotRow) {
  return {
    id: row.id,
    slotDate: row.slot_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const slotDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");
const slotTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.");
const availabilityGenerationSchema = z.object({
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  startTime: slotTimeSchema,
  endTime: slotTimeSchema,
  durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90), z.literal(120)]),
});

function assertSlotRange(startTime: string, endTime: string) {
  if (startTime >= endTime) throw new TRPCError({ code: "BAD_REQUEST", message: "O horário de término deve ser posterior ao início." });
}

function formatScheduledAt(slot: Pick<AvailabilitySlotRow, "slot_date" | "start_time">) {
  return `${slot.slot_date} ${slot.start_time}`;
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("Cookie") ?? "";
  return cookies.split(";").map(item => item.trim()).find(item => item.startsWith(`${name}=`))?.slice(name.length + 1);
}

function sessionKey(env: Env) {
  if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET não foi configurado.");
  return textEncoder.encode(env.SESSION_SECRET);
}

async function createSession(user: StudioUser, env: Env) {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(sessionKey(env));
}

function sessionCookie(value: string, maxAge = YEAR_IN_SECONDS) {
  return `${SESSION_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

async function userFromRequest(request: Request, env: Env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(env));
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id < 1) return null;
    const row = await env.DB.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").bind(id).first<UserRow>();
    return row ? toUser(row) : null;
  } catch {
    return null;
  }
}

async function createContext(request: Request, env: Env): Promise<Context> {
  return { request, env, user: await userFromRequest(request, env), responseHeaders: new Headers() };
}

async function ensureServices(env: Env) {
  const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM studio_services").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;
  await env.DB.batch(
    SERVICES.map(([name, category, description, price], index) =>
      env.DB
        .prepare("INSERT OR IGNORE INTO studio_services (slug, name, category, description, price, is_price_on_request, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, 1, ?)")
        .bind(slugify(name), name, category, description, price ?? 0, price === null ? 1 : 0, index + 1),
    ),
  );
}

async function listServices(env: Env, includeInactive = false) {
  await ensureServices(env);
  const query = includeInactive
    ? "SELECT * FROM studio_services ORDER BY sort_order ASC"
    : "SELECT * FROM studio_services WHERE is_active = 1 ORDER BY sort_order ASC";
  const result = await env.DB.prepare(query).all<ServiceRow>();
  return result.results.map(toService);
}

async function handleAuth(request: Request, env: Env) {
  if (request.method !== "POST") return new Response("Método não permitido", { status: 405 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const loginSchema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(10).max(128) });
  const registerSchema = loginSchema.extend({ name: z.string().trim().min(2).max(120) });
  const registering = new URL(request.url).pathname.endsWith("/register");
  const parsed = (registering ? registerSchema : loginSchema).safeParse(body);
  if (!parsed.success) return Response.json({ error: "Confira o e-mail e use uma senha com pelo menos 10 caracteres." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  let row = await env.DB.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").bind(email).first<UserRow>();
  if (registering) {
    if (row) return Response.json({ error: "Este e-mail já possui cadastro. Entre com sua senha." }, { status: 409 });
    const passwordHash = await hashPassword(parsed.data.password);
    const role: "admin" | "user" = email === env.INITIAL_ADMIN_EMAIL?.toLowerCase() ? "admin" : "user";
    await env.DB.prepare("INSERT INTO users (open_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)")
      .bind(`local:${email}`, parsed.data.name, email, passwordHash, role)
      .run();
    row = await env.DB.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").bind(email).first<UserRow>();
  } else if (!row || !(await verifyPassword(parsed.data.password, row.password_hash))) {
    return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  if (!row) return Response.json({ error: "Não foi possível criar o acesso." }, { status: 500 });
  await env.DB.prepare("UPDATE users SET last_signed_in = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id).run();
  const current = await env.DB.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").bind(row.id).first<UserRow>();
  const user = toUser(current ?? row);
  const token = await createSession(user, env);
  return Response.json({ user }, { headers: { "Set-Cookie": sessionCookie(token) } });
}

const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.responseHeaders.append("Set-Cookie", sessionCookie("", 0));
      return { success: true } as const;
    }),
  }),
  studio: router({
    services: publicProcedure.query(({ ctx }) => listServices(ctx.env)),
    availableDates: publicProcedure.query(async ({ ctx }) => {
      const result = await ctx.env.DB.prepare("SELECT DISTINCT slot_date FROM studio_availability_slots WHERE status = 'available' AND slot_date >= date('now', '-1 day') ORDER BY slot_date ASC LIMIT 90").all<{ slot_date: string }>();
      return result.results.map(row => row.slot_date);
    }),
    availabilityForDate: publicProcedure
      .input(z.object({ slotDate: slotDateSchema }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.env.DB.prepare("SELECT * FROM studio_availability_slots WHERE slot_date = ? AND status = 'available' ORDER BY start_time ASC").bind(input.slotDate).all<AvailabilitySlotRow>();
        return result.results.map(toAvailabilitySlot);
      }),
    scheduleBooking: publicProcedure
      .input(z.object({ availabilitySlotId: z.number().int().positive(), serviceId: z.number().int().positive(), customerName: z.string().trim().min(2).max(120), customerPhone: z.string().trim().min(8).max(24), notes: z.string().trim().max(600).optional() }))
      .mutation(async ({ ctx, input }) => {
        await ensureServices(ctx.env);
        const service = await ctx.env.DB.prepare("SELECT id, is_active FROM studio_services WHERE id = ? LIMIT 1").bind(input.serviceId).first<{ id: number; is_active: number }>();
        if (!service || !service.is_active) throw new TRPCError({ code: "BAD_REQUEST", message: "Este serviço não está disponível no momento." });
        const slot = await ctx.env.DB.prepare("SELECT * FROM studio_availability_slots WHERE id = ? LIMIT 1").bind(input.availabilitySlotId).first<AvailabilitySlotRow>();
        if (!slot || slot.status !== "available") throw new TRPCError({ code: "CONFLICT", message: "Este horário acabou de ser reservado. Escolha outro horário disponível." });
        const reservation = await ctx.env.DB.prepare("UPDATE studio_availability_slots SET status = 'booked', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'available'")
          .bind(input.availabilitySlotId)
          .run();
        if ((reservation.meta.changes ?? 0) !== 1) throw new TRPCError({ code: "CONFLICT", message: "Este horário acabou de ser reservado. Escolha outro horário disponível." });
        try {
          await ctx.env.DB.prepare("INSERT INTO studio_bookings (service_id, availability_slot_id, customer_name, customer_phone, notes, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?, 'confirmed')")
            .bind(input.serviceId, input.availabilitySlotId, input.customerName, input.customerPhone, input.notes || null, formatScheduledAt(slot))
            .run();
        } catch (error) {
          await ctx.env.DB.prepare("UPDATE studio_availability_slots SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'booked'").bind(input.availabilitySlotId).run();
          throw error;
        }
        return { success: true, slotDate: slot.slot_date, startTime: slot.start_time, endTime: slot.end_time } as const;
      }),
  }),
  admin: router({
    access: adminProcedure.query(({ ctx }) => ({ isProjectOwner: ctx.user.email === ctx.env.INITIAL_ADMIN_EMAIL?.toLowerCase() })),
    services: adminProcedure.query(({ ctx }) => listServices(ctx.env, true)),
    updateService: adminProcedure
      .input(z.object({ id: z.number().int().positive(), price: z.string().regex(/^\d{1,7}(\.\d{1,2})?$/), isPriceOnRequest: z.boolean(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.env.DB.prepare("UPDATE studio_services SET price = ?, is_price_on_request = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(Number(input.price), input.isPriceOnRequest ? 1 : 0, input.isActive ? 1 : 0, input.id)
          .run();
        return { success: true } as const;
      }),
    availability: adminProcedure.query(async ({ ctx }) => {
      const result = await ctx.env.DB.prepare("SELECT * FROM studio_availability_slots WHERE slot_date >= date('now', '-1 day') ORDER BY slot_date ASC, start_time ASC LIMIT 300").all<AvailabilitySlotRow>();
      return result.results.map(toAvailabilitySlot);
    }),
    createAvailability: adminProcedure
      .input(z.object({ slotDate: slotDateSchema, startTime: slotTimeSchema, endTime: slotTimeSchema }))
      .mutation(async ({ ctx, input }) => {
        assertSlotRange(input.startTime, input.endTime);
        try {
          await ctx.env.DB.prepare("INSERT INTO studio_availability_slots (slot_date, start_time, end_time, status) VALUES (?, ?, ?, 'available')")
            .bind(input.slotDate, input.startTime, input.endTime)
            .run();
        } catch {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe um horário cadastrado nesse início. Escolha outro horário ou edite o existente." });
        }
        return { success: true } as const;
      }),
    generateAvailability: adminProcedure
      .input(availabilityGenerationSchema)
      .mutation(async ({ ctx, input }) => {
        let slots;
        try {
          slots = generateAvailabilitySlots(withUpcomingAvailabilityPeriod(input));
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível gerar os horários." });
        }
        let created = 0;
        for (let index = 0; index < slots.length; index += 100) {
          const batch = await ctx.env.DB.batch(slots.slice(index, index + 100).map(slot =>
            ctx.env.DB.prepare("INSERT OR IGNORE INTO studio_availability_slots (slot_date, start_time, end_time, status) VALUES (?, ?, ?, 'available')")
              .bind(slot.slotDate, slot.startTime, slot.endTime),
          ));
          created += batch.reduce((count, result) => count + (result.meta.changes ?? 0), 0);
        }
        return { created, total: slots.length };
      }),
    closeAvailabilityDate: adminProcedure
      .input(z.object({ slotDate: slotDateSchema }))
      .mutation(async ({ ctx, input }) => {
        const update = await ctx.env.DB.prepare("UPDATE studio_availability_slots SET status = 'blocked', updated_at = CURRENT_TIMESTAMP WHERE slot_date = ? AND status = 'available'")
          .bind(input.slotDate)
          .run();
        return { success: true, blocked: update.meta.changes ?? 0 } as const;
      }),
    updateAvailability: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["available", "blocked"]) }))
      .mutation(async ({ ctx, input }) => {
        const update = await ctx.env.DB.prepare("UPDATE studio_availability_slots SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'booked'")
          .bind(input.status, input.id)
          .run();
        if ((update.meta.changes ?? 0) !== 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Horários já reservados só podem ser liberados ao cancelar o atendimento correspondente." });
        return { success: true } as const;
      }),
    deleteAvailability: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const deletion = await ctx.env.DB.prepare("DELETE FROM studio_availability_slots WHERE id = ? AND status != 'booked'").bind(input.id).run();
        if ((deletion.meta.changes ?? 0) !== 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível excluir um horário já reservado." });
        return { success: true } as const;
      }),
    bookings: adminProcedure.query(async ({ ctx }) => {
      const result = await ctx.env.DB.prepare("SELECT b.id, b.customer_name AS customerName, b.customer_phone AS customerPhone, b.notes, b.scheduled_at AS scheduledAt, b.status, b.created_at AS createdAt, s.name AS serviceName, a.slot_date AS slotDate, a.start_time AS startTime, a.end_time AS endTime FROM studio_bookings b INNER JOIN studio_services s ON s.id = b.service_id LEFT JOIN studio_availability_slots a ON a.id = b.availability_slot_id ORDER BY CASE WHEN a.slot_date IS NULL THEN 1 ELSE 0 END, a.slot_date ASC, a.start_time ASC, b.created_at DESC").all();
      return result.results;
    }),
    updateBookingStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["requested", "confirmed", "completed", "cancelled"]) }))
      .mutation(async ({ ctx, input }) => {
        const booking = await ctx.env.DB.prepare("SELECT availability_slot_id, status FROM studio_bookings WHERE id = ? LIMIT 1").bind(input.id).first<{ availability_slot_id: number | null; status: "requested" | "confirmed" | "completed" | "cancelled" }>();
        if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado." });
        if (booking.availability_slot_id && booking.status !== input.status) {
          if (input.status === "cancelled") {
            await ctx.env.DB.prepare("UPDATE studio_availability_slots SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'booked'").bind(booking.availability_slot_id).run();
          } else if (booking.status === "cancelled") {
            const reservation = await ctx.env.DB.prepare("UPDATE studio_availability_slots SET status = 'booked', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'available'").bind(booking.availability_slot_id).run();
            if ((reservation.meta.changes ?? 0) !== 1) throw new TRPCError({ code: "CONFLICT", message: "Este horário não está mais disponível para reativar o atendimento." });
          }
        }
        await ctx.env.DB.prepare("UPDATE studio_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(input.status, input.id).run();
        return { success: true } as const;
      }),
    users: adminProcedure.query(async ({ ctx }) => {
      const result = await ctx.env.DB.prepare("SELECT id, name, email, role, last_signed_in AS lastSignedIn FROM users ORDER BY last_signed_in DESC").all();
      return result.results;
    }),
    updateUserRole: adminProcedure
      .input(z.object({ id: z.number().int().positive(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.email !== ctx.env.INITIAL_ADMIN_EMAIL?.toLowerCase()) throw new TRPCError({ code: "FORBIDDEN", message: "Somente a proprietária pode administrar acessos." });
        if (ctx.user.id === input.id && input.role !== "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "A proprietária não pode remover o próprio acesso de administradora." });
        await ctx.env.DB.prepare("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(input.role, input.id).run();
        return { success: true } as const;
      }),
  }),
});

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/auth/login") || url.pathname.startsWith("/api/auth/register")) return handleAuth(request, env);
    if (url.pathname === "/api/trpc" || url.pathname.startsWith("/api/trpc/")) {
      return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: async () => createContext(request, env),
        responseMeta({ ctx }) {
          return { headers: ctx?.responseHeaders };
        },
        onError({ error }) {
          console.error("[tRPC]", error.message);
        },
      });
    }

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || request.method !== "GET") return asset;
    return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
  },
} satisfies ExportedHandler<Env>;
