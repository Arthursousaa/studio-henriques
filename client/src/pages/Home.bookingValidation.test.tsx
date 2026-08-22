import { describe, expect, it } from "vitest";
import { bookingErrorMessage, bookingFormValidationMessage, type PublicStudioService } from "./Home";

const service: PublicStudioService = {
  id: 1,
  slug: "manicure",
  name: "Manicure",
  category: "Unhas",
  description: "Cuidado para as unhas.",
  price: "45.00",
  isPriceOnRequest: false,
};

const validForm = {
  serviceId: "1",
  customerName: "Fernanda",
  customerPhone: "11983853607",
  notes: "",
  depilationMethod: "" as const,
  slotDate: "2026-08-24",
  availabilitySlotId: "10",
};

describe("validação amigável do agendamento", () => {
  it("pede serviço, data e horário antes de tentar reservar", () => {
    expect(bookingFormValidationMessage(validForm, undefined)).toBe("Escolha o serviço que deseja agendar.");
    expect(bookingFormValidationMessage({ ...validForm, slotDate: "" }, service)).toBe("Escolha uma data disponível no calendário.");
    expect(bookingFormValidationMessage({ ...validForm, availabilitySlotId: "" }, service)).toBe("Escolha um horário disponível.");
  });

  it("pede um nome válido antes de chamar o servidor", () => {
    expect(bookingFormValidationMessage({ ...validForm, customerName: "F" }, service)).toBe("Digite seu nome com pelo menos 2 letras.");
  });

  it("pede um WhatsApp com DDD", () => {
    expect(bookingFormValidationMessage({ ...validForm, customerPhone: "119" }, service)).toBe("Digite um WhatsApp válido com DDD.");
  });

  it("não expõe a resposta técnica de validação recebida do servidor", () => {
    expect(bookingErrorMessage('[{"path":["customerName"],"message":"Too small"}]')).toBe("Digite seu nome com pelo menos 2 letras.");
    expect(bookingErrorMessage("mensagem inesperada")).toBe("Não foi possível concluir o agendamento agora. Confira os dados e tente novamente.");
  });
});
