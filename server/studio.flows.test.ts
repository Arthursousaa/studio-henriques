import { afterEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  listStudioServices: vi.fn(),
  getStudioService: vi.fn(),
  createStudioBooking: vi.fn(),
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
