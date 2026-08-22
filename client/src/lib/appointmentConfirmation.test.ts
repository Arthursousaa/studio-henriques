import { describe, expect, it } from "vitest";
import { formatAppointmentSlot, whatsappBookingRequestUrl, whatsappConfirmationUrl } from "./appointmentConfirmation";

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

  it("prepara a mensagem da cliente para a Jaqueline sem enviar automaticamente", () => {
    const url = new URL(whatsappBookingRequestUrl({ customerName: "Ana Silva", serviceName: "Manicure", slotDate: "2026-08-20", startTime: "10:00", endTime: "11:00" }));

    expect(url.origin + url.pathname).toBe("https://wa.me/5511992698360");
    expect(url.searchParams.get("text")).toContain("Ana Silva");
    expect(url.searchParams.get("text")).toContain("Manicure");
    expect(url.searchParams.get("text")).toContain("20 de agosto");
  });
});
