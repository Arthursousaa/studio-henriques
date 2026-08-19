import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const studioServices = mysqlTable("studio_services", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isPriceOnRequest: boolean("isPriceOnRequest").notNull().default(false),
  isActive: boolean("isActive").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studioBookingStatus = mysqlEnum("studio_booking_status", [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
]);

export const studioAvailabilityStatus = mysqlEnum("studio_availability_status", [
  "available",
  "blocked",
  "booked",
]);

export const studioAvailabilitySlots = mysqlTable("studio_availability_slots", {
  id: int("id").autoincrement().primaryKey(),
  slotDate: varchar("slotDate", { length: 10 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  status: studioAvailabilityStatus.notNull().default("available"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studioBookings = mysqlTable("studio_bookings", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").notNull(),
  availabilitySlotId: int("availabilitySlotId"),
  customerName: varchar("customerName", { length: 120 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 24 }).notNull(),
  notes: text("notes"),
  scheduledAt: timestamp("scheduledAt"),
  status: studioBookingStatus.notNull().default("requested"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudioService = typeof studioServices.$inferSelect;
export type StudioBooking = typeof studioBookings.$inferSelect;
export type StudioAvailabilitySlot = typeof studioAvailabilitySlots.$inferSelect;
