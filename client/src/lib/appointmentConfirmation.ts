export type AppointmentForConfirmation = {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  slotDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type CustomerBookingForWhatsapp = Omit<AppointmentForConfirmation, "customerPhone">;

export function formatAppointmentSlot(slotDate?: string | null, startTime?: string | null, endTime?: string | null) {
  if (!slotDate || !startTime) return "Horário a combinar";
  const localDate = new Date(`${slotDate}T${startTime}:00`);
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(localDate);
  return `${dateLabel} · ${startTime}${endTime ? ` às ${endTime}` : ""}`;
}

export function whatsappConfirmationUrl(booking: AppointmentForConfirmation) {
  const digits = booking.customerPhone.replace(/\D/g, "");
  const destination = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  const dateTime = formatAppointmentSlot(booking.slotDate, booking.startTime, booking.endTime);
  const message = `Olá, ${booking.customerName}! Seu atendimento no Studio Henriques está confirmado.\n\nServiço: ${booking.serviceName}\nData e horário: ${dateTime}\n\nQualquer dúvida, estamos à disposição.`;
  return `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
}

export function whatsappBookingRequestUrl(booking: CustomerBookingForWhatsapp) {
  const dateTime = formatAppointmentSlot(booking.slotDate, booking.startTime, booking.endTime);
  const message = `Olá, Jaqueline! Acabei de reservar um horário pelo site do Studio Henriques.\n\nNome: ${booking.customerName}\nServiço: ${booking.serviceName}\nData e horário: ${dateTime}\n\nFico no aguardo da confirmação. Obrigada!`;
  return `https://wa.me/5511992698360?text=${encodeURIComponent(message)}`;
}
