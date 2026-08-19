import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, categories, formatPrice, services } from "./catalog.js";

describe("catálogo estático do Studio Henriques", () => {
  it("mantém todas as categorias públicas e os 28 serviços", () => {
    expect(services).toHaveLength(28);
    expect(categories).toEqual(["Todos", "Unhas", "Pés", "Facial", "Depilação", "Massagens", "Pacotes mensais"]);
  });

  it("formata valores e mantém maquiagem sob orçamento", () => {
    expect(formatPrice(25)).toBe("R$ 25,00");
    expect(formatPrice(null)).toBe("Sob orçamento");
  });

  it("prepara uma mensagem de WhatsApp sem enviá-la automaticamente", () => {
    expect(buildWhatsAppMessage({
      name: " Ana ",
      phone: " (11) 99999-9999 ",
      service: "Manicure",
      message: " Gostaria de saber horários. ",
    })).toBe("Olá, meu nome é Ana. Gostaria de mais informações sobre Manicure. Meu WhatsApp: (11) 99999-9999. Observação: Gostaria de saber horários.");
  });
});
