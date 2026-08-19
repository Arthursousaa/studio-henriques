export type AvailabilityGenerationInput = {
  startDate: string;
  endDate: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

export type GeneratedAvailabilitySlot = {
  slotDate: string;
  startTime: string;
  endTime: string;
};

const MAX_GENERATED_SLOTS = 500;

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function toUtcDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Informe um período válido para a agenda.");
  }
  return date;
}

export function generateAvailabilitySlots(input: AvailabilityGenerationInput): GeneratedAvailabilitySlot[] {
  const startDate = toUtcDate(input.startDate);
  const endDate = toUtcDate(input.endDate);
  const selectedWeekdays = new Set(input.weekdays);
  const startMinutes = toMinutes(input.startTime);
  const endMinutes = toMinutes(input.endTime);

  if (endDate < startDate) throw new Error("A data final deve ser posterior à data inicial.");
  if (selectedWeekdays.size === 0) throw new Error("Selecione ao menos um dia de atendimento.");
  if (startMinutes >= endMinutes) throw new Error("O horário de término deve ser posterior ao início.");

  const slots: GeneratedAvailabilitySlot[] = [];
  for (const date = new Date(startDate); date <= endDate; date.setUTCDate(date.getUTCDate() + 1)) {
    if (!selectedWeekdays.has(date.getUTCDay())) continue;
    const slotDate = date.toISOString().slice(0, 10);
    for (let current = startMinutes; current + input.durationMinutes <= endMinutes; current += input.durationMinutes) {
      slots.push({ slotDate, startTime: toTime(current), endTime: toTime(current + input.durationMinutes) });
      if (slots.length > MAX_GENERATED_SLOTS) {
        throw new Error("Escolha um período menor ou uma duração maior; o limite é de 500 horários por geração.");
      }
    }
  }

  if (slots.length === 0) throw new Error("Não há horários completos com as regras escolhidas.");
  return slots;
}
