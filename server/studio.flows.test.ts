import { afterEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createStudioAvailability: vi.fn(),
  generateStudioAvailability: vi.fn(),
  closeStudioAvailabilityDate: vi.fn(),
  listStudioServices: vi.fn(),
  listAvailableStudioDates: vi.fn(),
  listAvailableStudioAvailabilityForDate: vi.fn(),
  listStudioAvailability: vi.fn(),
  getStudioService: vi.fn(),
  createStudioBooking: vi.fn(),
  scheduleStudioBooking: vi.fn(),
  updateStudioAvailability: vi.fn(),
  deleteStudioAvailability: vi.fn(),
  updateStudioService: vi.fn(),
  listStudioBookings: vi.fn(),
  updateStudioBookingStatus: vi.fn(),
  listStudioUsers: vi.fn(),
  updateStudioUserRole: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";

function createContext(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role
      ? {
          id: 1,
          openId: `${role}-user`,
          email: `${role}@example.com`,
          name: role,
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const activeService = {
  id: 1,
  slug: "manicure",
  name: "Manicure",
  category: "Unhas",
  description: "Cuidado para unhas.",
  price: "55.00",
  isPriceOnRequest: false,
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Studio Henriques core flows", () => {
  const originalOwnerOpenId = ENV.ownerOpenId;

  afterEach(() => {
    ENV.ownerOpenId = originalOwnerOpenId;
    vi.clearAllMocks();
  });
  it("lists only public services for the website", async () => {
    dbMocks.listStudioServices.mockResolvedValue([activeService]);
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.studio.services()).resolves.toEqual([activeService]);
    expect(dbMocks.listStudioServices).toHaveBeenCalledWith();
  });

  it("records a valid booking request", async () => {
    dbMocks.getStudioService.mockResolvedValue(activeService);
    dbMocks.createStudioBooking.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext(null));

    await expect(
      caller.studio.requestBooking({
        serviceId: activeService.id,
        customerName: "Ana Silva",
        customerPhone: "11999999999",
        notes: "Prefiro horário pela manhã.",
      }),
    ).resolves.toEqual({ success: true });

    expect(dbMocks.getStudioService).toHaveBeenCalledWith(activeService.id);
    expect(dbMocks.createStudioBooking).toHaveBeenCalledWith({
      serviceId: activeService.id,
      customerName: "Ana Silva",
      customerPhone: "11999999999",
      notes: "Prefiro horário pela manhã.",
    });
  });

  it("lists only dates and times that are currently available", async () => {
    dbMocks.listAvailableStudioDates.mockResolvedValue(["2026-08-20"]);
    dbMocks.listAvailableStudioAvailabilityForDate.mockResolvedValue([{ id: 44, slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00", status: "available" }]);
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.studio.availableDates()).resolves.toEqual(["2026-08-20"]);
    await expect(caller.studio.availabilityForDate({ slotDate: "2026-08-20" })).resolves.toEqual([{ id: 44, slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00", status: "available" }]);
  });

  it("confirms a valid reservation and rejects a slot that has just become unavailable", async () => {
    dbMocks.getStudioService.mockResolvedValue(activeService);
    dbMocks.scheduleStudioBooking.mockResolvedValueOnce({ slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00" }).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createContext(null));
    const booking = { availabilitySlotId: 44, serviceId: activeService.id, customerName: "Ana Silva", customerPhone: "11999999999", notes: "" };

    await expect(caller.studio.scheduleBooking(booking)).resolves.toEqual({ success: true, slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00" });
    await expect(caller.studio.scheduleBooking(booking)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("lets the administrator update a service price and availability", async () => {
    dbMocks.updateStudioService.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(
      caller.admin.updateService({ id: 1, price: "79.90", isPriceOnRequest: false, isActive: false }),
    ).resolves.toEqual({ success: true });

    expect(dbMocks.updateStudioService).toHaveBeenCalledWith(1, {
      price: "79.90",
      isPriceOnRequest: false,
      isActive: false,
    });
  });

  it("lets the administrator add a valid availability slot and rejects an invalid time range", async () => {
    dbMocks.createStudioAvailability.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.admin.createAvailability({ slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00" })).resolves.toEqual({ success: true });
    expect(dbMocks.createStudioAvailability).toHaveBeenCalledWith({ slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00" });
    await expect(caller.admin.createAvailability({ slotDate: "2026-08-20", startTime: "11:00", endTime: "10:00" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("lets the administrator generate operating hours and close a date without touching booked slots", async () => {
    dbMocks.generateStudioAvailability.mockResolvedValue({ created: 18, total: 18 });
    dbMocks.closeStudioAvailabilityDate.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));
    const operatingHours = { startDate: "2026-08-20", endDate: "2026-08-31", weekdays: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00", durationMinutes: 60 as const };

    await expect(caller.admin.generateAvailability(operatingHours)).resolves.toEqual({ created: 18, total: 18 });
    expect(dbMocks.generateStudioAvailability).toHaveBeenCalledWith(operatingHours);
    await expect(caller.admin.closeAvailabilityDate({ slotDate: "2026-08-28" })).resolves.toEqual({ success: true });
    expect(dbMocks.closeStudioAvailabilityDate).toHaveBeenCalledWith("2026-08-28");
  });

  it("lets the administrator block a free slot or remove it from the public calendar", async () => {
    dbMocks.updateStudioAvailability.mockResolvedValue(undefined);
    dbMocks.deleteStudioAvailability.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.admin.updateAvailability({ id: 44, status: "blocked" })).resolves.toEqual({ success: true });
    await expect(caller.admin.deleteAvailability({ id: 45 })).resolves.toEqual({ success: true });
    expect(dbMocks.updateStudioAvailability).toHaveBeenCalledWith(44, "blocked");
    expect(dbMocks.deleteStudioAvailability).toHaveBeenCalledWith(45);
  });

  it("lets the administrator mark a service as priced on request", async () => {
    dbMocks.updateStudioService.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(
      caller.admin.updateService({ id: 13, price: "0", isPriceOnRequest: true, isActive: true }),
    ).resolves.toEqual({ success: true });

    expect(dbMocks.updateStudioService).toHaveBeenCalledWith(13, {
      price: "0",
      isPriceOnRequest: true,
      isActive: true,
    });
  });

  it("lets the administrator update an appointment status", async () => {
    dbMocks.updateStudioBookingStatus.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(
      caller.admin.updateBookingStatus({ id: 8, status: "confirmed" }),
    ).resolves.toEqual({ success: true });

    expect(dbMocks.updateStudioBookingStatus).toHaveBeenCalledWith(8, "confirmed");
  });

  it("allows administrators to read the accounts eligible for panel access", async () => {
    const accounts = [{ id: 1, name: "Jaqueline", email: "jaqueline@example.com", role: "user", lastSignedIn: new Date() }];
    dbMocks.listStudioUsers.mockResolvedValue(accounts);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.admin.users()).resolves.toEqual(accounts);
  });

  it("allows only the project owner to promote Jaqueline to administrator", async () => {
    ENV.ownerOpenId = "owner-open-id";
    dbMocks.updateStudioUserRole.mockResolvedValue(undefined);
    const ownerContext = createContext("admin");
    ownerContext.user!.openId = "owner-open-id";
    const ownerCaller = appRouter.createCaller(ownerContext);

    await expect(ownerCaller.admin.updateUserRole({ id: 25, role: "admin" })).resolves.toEqual({ success: true });
    expect(dbMocks.updateStudioUserRole).toHaveBeenCalledWith(25, "admin");

    const anotherAdmin = appRouter.createCaller(createContext("admin"));
    await expect(anotherAdmin.admin.updateUserRole({ id: 25, role: "admin" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Somente a proprietária do projeto pode administrar acessos.",
    });
  });
});
