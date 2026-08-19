/* @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  createAvailability: vi.fn(),
  generateAvailability: vi.fn(),
  closeAvailabilityDate: vi.fn(),
  updateAvailability: vi.fn(),
  deleteAvailability: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 1, name: "Arthur", role: "admin" }, loading: false }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const emptyQuery = { data: [], isLoading: false };
const emptyMutation = { mutate: vi.fn(), isPending: false };
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      admin: { availability: { invalidate: vi.fn() }, bookings: { invalidate: vi.fn() }, services: { invalidate: vi.fn() }, users: { invalidate: vi.fn() } },
      studio: { availableDates: { invalidate: vi.fn() }, availabilityForDate: { invalidate: vi.fn() }, services: { invalidate: vi.fn() } },
    }),
    admin: {
      access: { useQuery: () => ({ data: { isProjectOwner: true }, isLoading: false }) },
      services: { useQuery: () => emptyQuery },
      bookings: { useQuery: () => ({ data: [{ id: 9, customerName: "Ana", customerPhone: "(11) 99999-9999", notes: null, status: "confirmed", createdAt: new Date(), serviceName: "Manicure", slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00" }], isLoading: false }) },
      users: { useQuery: () => emptyQuery },
      availability: { useQuery: () => ({ data: [{ id: 12, slotDate: "2026-08-20", startTime: "09:00", endTime: "10:00", status: "available" }], isLoading: false }) },
      updateService: { useMutation: () => emptyMutation },
      updateBookingStatus: { useMutation: () => emptyMutation },
      updateUserRole: { useMutation: () => emptyMutation },
      createAvailability: { useMutation: () => ({ mutate: actions.createAvailability, isPending: false }) },
      generateAvailability: { useMutation: () => ({ mutate: actions.generateAvailability, isPending: false }) },
      closeAvailabilityDate: { useMutation: () => ({ mutate: actions.closeAvailabilityDate, isPending: false }) },
      updateAvailability: { useMutation: () => ({ mutate: actions.updateAvailability, isPending: false }) },
      deleteAvailability: { useMutation: () => ({ mutate: actions.deleteAvailability, isPending: false }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Admin from "./Admin";

describe("agenda no painel administrativo", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("permite definir o funcionamento, fechar um dia e preparar a confirmação sem enviar a mensagem", async () => {
    const user = userEvent.setup();
    render(<Admin />);

    expect(screen.getByRole("heading", { name: "Agenda e horários" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Data específica"), { target: { value: "2026-08-21" } });
    fireEvent.change(screen.getByLabelText("Início específico"), { target: { value: "13:00" } });
    fireEvent.change(screen.getByLabelText("Término específico"), { target: { value: "14:00" } });
    await user.click(screen.getByRole("button", { name: /Liberar/i }));
    expect(actions.createAvailability).toHaveBeenCalledWith({ slotDate: "2026-08-21", startTime: "13:00", endTime: "14:00" });

    await user.click(screen.getByRole("button", { name: "Atualizar horários" }));
    expect(actions.generateAvailability).toHaveBeenCalledWith({ weekdays: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00", durationMinutes: 60 });
    fireEvent.change(screen.getByLabelText("Data para fechar"), { target: { value: "2026-08-21" } });
    await user.click(screen.getByRole("button", { name: "Fechar dia" }));
    expect(actions.closeAvailabilityDate).toHaveBeenCalledWith({ slotDate: "2026-08-21" });

    await user.click(screen.getByRole("button", { name: "Bloquear" }));
    await user.click(screen.getByRole("button", { name: "Remover" }));
    expect(actions.updateAvailability).toHaveBeenCalledWith({ id: 12, status: "blocked" });
    expect(actions.deleteAvailability).toHaveBeenCalledWith({ id: 12 });

    const confirmation = screen.getByRole("link", { name: /Preparar confirmação/i });
    expect(confirmation.getAttribute("href")).toContain("https://wa.me/5511999999999?text=");
    expect(confirmation.getAttribute("target")).toBe("_blank");
  });
});
