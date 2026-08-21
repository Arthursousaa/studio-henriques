/* @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  generateAvailability: vi.fn(),
  closeAvailabilityDate: vi.fn(),
  reopenAvailabilityDate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 1, name: "Arthur", role: "admin" }, loading: false }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const emptyQuery = { data: [], isLoading: false };
const servicesQuery = { data: [] as Array<{ id: number; name: string; category: string; description: string; price: string; isPriceOnRequest: boolean; isActive: boolean }>, isLoading: false };
const emptyMutation = { mutate: vi.fn(), isPending: false };
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      admin: { availability: { invalidate: vi.fn() }, bookings: { invalidate: vi.fn() }, services: { invalidate: vi.fn() }, users: { invalidate: vi.fn() } },
      studio: { availableDates: { invalidate: vi.fn() }, availabilityForDate: { invalidate: vi.fn() }, services: { invalidate: vi.fn() } },
    }),
    admin: {
      access: { useQuery: () => ({ data: { isProjectOwner: true }, isLoading: false }) },
      services: { useQuery: () => servicesQuery },
      bookings: { useQuery: () => ({ data: [{ id: 9, customerName: "Ana", customerPhone: "(11) 99999-9999", notes: null, status: "confirmed", createdAt: new Date(), serviceName: "Manicure", slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00" }], isLoading: false }) },
      users: { useQuery: () => emptyQuery },
      availability: { useQuery: () => emptyQuery },
      updateService: { useMutation: () => emptyMutation },
      updateBookingStatus: { useMutation: () => emptyMutation },
      updateUserRole: { useMutation: () => emptyMutation },
      generateAvailability: { useMutation: () => ({ mutate: actions.generateAvailability, isPending: false }) },
      closeAvailabilityDate: { useMutation: () => ({ mutate: actions.closeAvailabilityDate, isPending: false }) },
      reopenAvailabilityDate: { useMutation: () => ({ mutate: actions.reopenAvailabilityDate, isPending: false }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Admin from "./Admin";

describe("agenda no painel administrativo", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    servicesQuery.data = [];
  });

  it("deixa o Studio aberto todos os dias por padrão, permite ajustar o funcionamento e fechar uma data", async () => {
    const user = userEvent.setup();
    render(<Admin />);

    expect(screen.getByRole("heading", { name: "Funcionamento do Studio" })).toBeTruthy();
    expect(screen.queryByText("Ajuste pontual")).toBeNull();
    expect(screen.queryByRole("button", { name: "Bloquear" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remover" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Salvar funcionamento" }));
    expect(actions.generateAvailability).toHaveBeenCalledWith({ weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: "09:00", endTime: "18:00", durationMinutes: 60 });
    fireEvent.change(screen.getByLabelText("Data para fechar"), { target: { value: "2026-08-21" } });
    await user.click(screen.getByRole("button", { name: "Fechar esta data" }));
    expect(actions.closeAvailabilityDate).toHaveBeenCalledWith({ slotDate: "2026-08-21" });
    await user.click(screen.getByRole("button", { name: "Reabrir esta data" }));
    expect(actions.reopenAvailabilityDate).toHaveBeenCalledWith({ slotDate: "2026-08-21" });

    const confirmation = screen.getByRole("link", { name: /Preparar confirmação/i });
    expect(confirmation.getAttribute("href")).toContain("https://wa.me/5511999999999?text=");
    expect(confirmation.getAttribute("target")).toBe("_blank");
  });

  it("filtra os serviços por categoria sem esconder os controles de edição", async () => {
    const user = userEvent.setup();
    servicesQuery.data = [
      { id: 1, name: "Manicure", category: "Unhas", description: "Cuidado das unhas.", price: "25", isPriceOnRequest: false, isActive: true },
      { id: 2, name: "Massagem relaxante", category: "Massagens", description: "Relaxamento corporal.", price: "80", isPriceOnRequest: false, isActive: true },
    ];
    render(<Admin />);

    expect(screen.getByRole("button", { name: "Todos" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Manicure")).toBeTruthy();
    expect(screen.getByText("Massagem relaxante")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Unhas" }));
    expect(screen.getByRole("button", { name: "Unhas" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Manicure")).toBeTruthy();
    expect(screen.queryByText("Massagem relaxante")).toBeNull();
    expect(screen.getByLabelText("Preço em R$", { selector: "input" })).toBeTruthy();
  });
});
