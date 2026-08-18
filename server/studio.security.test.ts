import { describe, expect, it } from "vitest";
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

describe("Studio Henriques security", () => {
  it("blocks regular users from the administrative service list", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.admin.services()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects booking requests for past dates before any booking is created", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(
      caller.studio.requestBooking({
        serviceId: 1,
        customerName: "Cliente de teste",
        customerPhone: "11999999999",
        scheduledAt: new Date(Date.now() - 120_000),
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Escolha uma data e horário futuros.",
    });
  });
});
