/* @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { services, requestInformation } = vi.hoisted(() => ({
  services: [
    { id: 11, slug: "massagem-ventosa", name: "Massagem com ventosa", category: "Massagem", description: "Alívio e bem-estar.", price: "90.00", isPriceOnRequest: false },
    { id: 12, slug: "massagem-relaxante", name: "Massagem relaxante", category: "Massagem", description: "Pausa para o corpo.", price: "80.00", isPriceOnRequest: false },
    { id: 13, slug: "manicure", name: "Manicure", category: "Unhas", description: "Cuidado para as mãos.", price: "35.00", isPriceOnRequest: false },
  ],
  requestInformation: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    studio: {
      services: { useQuery: () => ({ data: services, isLoading: false }) },
      requestBooking: { useMutation: () => ({ mutate: requestInformation, isPending: false }) },
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
    vi.clearAllMocks();
  });

  it("filtra massagens e pré-seleciona o serviço clicado no formulário", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("tab", { name: "Massagem" }));

    expect(screen.getByText("Massagem com ventosa")).toBeTruthy();
    expect(screen.getByText("Massagem relaxante")).toBeTruthy();
    expect(screen.queryByText("Manicure")).toBeNull();

    await user.click(screen.getAllByRole("button", { name: "Quero saber mais" })[0]);

    expect((screen.getByLabelText("Qual serviço você deseja?") as HTMLSelectElement).value).toBe("11");
  });
});
