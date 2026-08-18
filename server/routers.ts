import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  createStudioBooking,
  getStudioService,
  listStudioBookings,
  listStudioServices,
  listStudioUsers,
  updateStudioBookingStatus,
  updateStudioService,
  updateStudioUserRole,
} from "./db";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  studio: router({
    services: publicProcedure.query(() => listStudioServices()),
    requestBooking: publicProcedure
      .input(
        z.object({
          serviceId: z.number().int().positive(),
          customerName: z.string().trim().min(2).max(120),
          customerPhone: z.string().trim().min(8).max(24),
          notes: z.string().trim().max(600).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const service = await getStudioService(input.serviceId);
        if (!service || !service.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Este serviço não está disponível no momento.",
          });
        }
        await createStudioBooking(input);
        return { success: true } as const;
      }),
  }),
  admin: router({
    access: adminProcedure.query(({ ctx }) => ({
      isProjectOwner: ctx.user.openId === ENV.ownerOpenId,
    })),
    services: adminProcedure.query(() => listStudioServices(true)),
    updateService: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          price: z.string().regex(/^\d{1,7}(\.\d{1,2})?$/),
          isPriceOnRequest: z.boolean(),
          isActive: z.boolean(),
        }),
      )
      .mutation(async ({ input }) => {
        await updateStudioService(input.id, {
          price: input.price,
          isPriceOnRequest: input.isPriceOnRequest,
          isActive: input.isActive,
        });
        return { success: true } as const;
      }),
    bookings: adminProcedure.query(() => listStudioBookings()),
    updateBookingStatus: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(["requested", "confirmed", "completed", "cancelled"]),
        }),
      )
      .mutation(async ({ input }) => {
        await updateStudioBookingStatus(input.id, input.status);
        return { success: true } as const;
      }),
    users: adminProcedure.query(() => listStudioUsers()),
    updateUserRole: adminProcedure
      .input(z.object({ id: z.number().int().positive(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.openId !== ENV.ownerOpenId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Somente a proprietária do projeto pode administrar acessos.",
          });
        }
        if (ctx.user.id === input.id && input.role !== "admin") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A proprietária não pode remover o próprio acesso de administradora.",
          });
        }
        await updateStudioUserRole(input.id, input.role);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
