export const STUDIO_TIME_ZONE = "America/Sao_Paulo";

export type AvailabilityVisibilitySlot = {
  slotDate: string;
  startTime: string;
};

type StudioClock = {
  date: string;
  time: string;
};

function studioClock(now: Date): StudioClock {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).reduce<Record<string, string>>((parts, part) => {
    if (part.type !== "literal") parts[part.type] = part.value;
    return parts;
  }, {});

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

/** Mantém horários futuros e remove os que já começaram no dia atual do Studio. */
export function isAvailabilitySlotVisible<T extends AvailabilityVisibilitySlot>(slot: T, now = new Date()): boolean {
  const current = studioClock(now);
  if (slot.slotDate > current.date) return true;
  if (slot.slotDate < current.date) return false;
  return slot.startTime > current.time;
}

export function filterVisibleAvailabilitySlots<T extends AvailabilityVisibilitySlot>(slots: T[], now = new Date()): T[] {
  return slots.filter(slot => isAvailabilitySlotVisible(slot, now));
}
