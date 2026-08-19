import { describe, expect, it } from "vitest";
import { formatAppointmentSlot, whatsappConfirmationUrl } from "./appointmentConfirmation";

describe("confirmação gratuita de atendimento", () => {
  it("formata o horário do atendimento para a mensagem", () => {
    expect(formatAppointmentSlot("2026-08-20", "10:00", "11:00")).toContain("10:00 às 11:00");
  });

  it("prepara um link do WhatsApp para a administradora revisar e enviar", () => {
    const url = whatsappConfirmationUrl({ customerName: "Ana", customerPhone: "(11) 99999-9999", serviceName: "Manicure", slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00" });

    expect(url).toContain("https://wa.me/5511999999999?text=");
    expect(decodeURIComponent(url)).toContain("Seu atendimento no Studio Henriques está confirmado.");
    expect(decodeURIComponent(url)).toContain("Serviço: Manicure");
  });
});
