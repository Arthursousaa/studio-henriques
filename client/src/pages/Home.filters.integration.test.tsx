/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { services, requestInformation, availableDates, availableSlots } = vi.hoisted(() => ({
  services: [
    { id: 11, slug: "massagem-ventosa", name: "Massagem com ventosa", category: "Massagem", description: "Alívio e bem-estar.", price: "90.00", isPriceOnRequest: false },
    { id: 12, slug: "massagem-relaxante", name: "Massagem relaxante", category: "Massagem", description: "Pausa para o corpo.", price: "80.00", isPriceOnRequest: false },
    { id: 13, slug: "manicure", name: "Manicure", category: "Unhas", description: "Cuidado para as mãos.", price: "35.00", isPriceOnRequest: false },
    { id: 14, slug: "axila", name: "Axila", category: "Depilação", description: "Escolha o método de sua preferência.", price: "30.00", isPriceOnRequest: false },
  ],
  requestInformation: vi.fn(),
  availableDates: ["2026-08-20", "2026-08-21"],
  availableSlots: [{ id: 50, slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00", status: "available" }],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    studio: {
      services: { useQuery: () => ({ data: services, isLoading: false }) },
      availableDates: { useQuery: () => ({ data: availableDates, isLoading: false, refetch: vi.fn() }) },
      availabilityForDate: { useQuery: () => ({ data: availableSlots, isLoading: false, refetch: vi.fn() }) },
      scheduleBooking: { useMutation: () => ({ mutate: requestInformation, isPending: false }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Home from "./Home";

describe("filtro de serviços e pedido de informações", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("abre as opções de massagem e pré-seleciona o serviço clicado no formulário", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /Massagem.*2 opções para escolher/i }));

    expect(screen.getByText("Massagem com ventosa")).toBeTruthy();
    expect(screen.getByText("Massagem relaxante")).toBeTruthy();
    expect(screen.queryByText("Manicure")).toBeNull();

    await user.click(screen.getAllByRole("button", { name: /Escolher opção/i })[0]);

    expect((screen.getByLabelText("Qual serviço você deseja?") as HTMLSelectElement).value).toBe("11");
  });

  it("permite escolher laser antes da área de depilação e registra a preferência no formulário", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /Depilação.*Escolha cera ou laser/i }));
    await user.click(screen.getByRole("button", { name: /Escolher laser/i }));

    expect(screen.getByText("Axila")).toBeTruthy();
    expect(screen.getByText("Sob consulta")).toBeTruthy();

    const axilaCard = screen.getByText("Axila").closest("article");
    expect(axilaCard).toBeTruthy();
    await user.click(within(axilaCard as HTMLElement).getByRole("button", { name: /Escolher opção/i }));

    expect((screen.getByLabelText("Qual serviço você deseja?") as HTMLSelectElement).value).toBe("14");
    expect(screen.getByRole("button", { name: "Laser" }).getAttribute("aria-pressed")).toBe("true");
  });
});
