import { describe, expect, it } from "vitest";
import { filterVisibleAvailabilitySlots, isAvailabilitySlotVisible } from "./availabilityVisibility";

describe("visibilidade de horários da agenda", () => {
  const now = new Date("2026-08-22T12:05:00.000Z"); // 09:05 em São Paulo

  it("remove horários que já começaram no dia atual e preserva os próximos", () => {
    const visible = filterVisibleAvailabilitySlots([
      { slotDate: "2026-08-22", startTime: "08:00" },
      { slotDate: "2026-08-22", startTime: "09:00" },
      { slotDate: "2026-08-22", startTime: "09:30" },
      { slotDate: "2026-08-22", startTime: "10:00" },
    ], now);

    expect(visible).toEqual([
      { slotDate: "2026-08-22", startTime: "09:30" },
      { slotDate: "2026-08-22", startTime: "10:00" },
    ]);
  });

  it("mantém todos os horários de uma data futura", () => {
    expect(isAvailabilitySlotVisible({ slotDate: "2026-08-23", startTime: "08:00" }, now)).toBe(true);
    expect(isAvailabilitySlotVisible({ slotDate: "2026-08-23", startTime: "18:00" }, now)).toBe(true);
  });

  it("reconhece a data do Studio mesmo quando o relógio UTC já virou o dia", () => {
    const eveningInSaoPaulo = new Date("2026-08-23T01:30:00.000Z"); // 22:30 de 22/08 em São Paulo

    expect(isAvailabilitySlotVisible({ slotDate: "2026-08-22", startTime: "22:00" }, eveningInSaoPaulo)).toBe(false);
    expect(isAvailabilitySlotVisible({ slotDate: "2026-08-22", startTime: "23:00" }, eveningInSaoPaulo)).toBe(true);
  });
});
