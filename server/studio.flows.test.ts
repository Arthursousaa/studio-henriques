import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  listStudioServices: vi.fn(),
  getStudioService: vi.fn(),
  createStudioBooking: vi.fn(),
  updateStudioService: vi.fn(),
  listStudioBookings: vi.fn(),
  updateStudioBookingStatus: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Studio Henriques core flows", () => {
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
    const scheduledAt = new Date(Date.now() + 86_400_000);

    await expect(
      caller.studio.requestBooking({
        serviceId: activeService.id,
        customerName: "Ana Silva",
        customerPhone: "11999999999",
        notes: "Prefiro horário pela manhã.",
        scheduledAt,
      }),
    ).resolves.toEqual({ success: true });

    expect(dbMocks.getStudioService).toHaveBeenCalledWith(activeService.id);
    expect(dbMocks.createStudioBooking).toHaveBeenCalledWith({
      serviceId: activeService.id,
      customerName: "Ana Silva",
      customerPhone: "11999999999",
      notes: "Prefiro horário pela manhã.",
      scheduledAt,
    });
  });

  it("lets the administrator update a service price and availability", async () => {
    dbMocks.updateStudioService.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(
      caller.admin.updateService({ id: 1, price: "79.90", isActive: false }),
    ).resolves.toEqual({ success: true });

    expect(dbMocks.updateStudioService).toHaveBeenCalledWith(1, {
      price: "79.90",
      isActive: false,
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
});
