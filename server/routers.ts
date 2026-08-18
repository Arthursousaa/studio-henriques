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
  updateStudioBookingStatus,
  updateStudioService,
} from "./db";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

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
          scheduledAt: z.date(),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.scheduledAt.getTime() < Date.now() - 60_000) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Escolha uma data e horário futuros.",
          });
        }
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
    services: adminProcedure.query(() => listStudioServices(true)),
    updateService: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          price: z.string().regex(/^\d{1,7}(\.\d{1,2})?$/),
          isActive: z.boolean(),
        }),
      )
      .mutation(async ({ input }) => {
        await updateStudioService(input.id, {
          price: input.price,
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
  }),
});

export type AppRouter = typeof appRouter;
