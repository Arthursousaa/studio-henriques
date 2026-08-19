import { describe, expect, it } from "vitest";
import { generateAvailabilitySlots } from "./availabilityGenerator";

describe("generateAvailabilitySlots", () => {
  it("gera os intervalos apenas nos dias de atendimento selecionados", () => {
    expect(generateAvailabilitySlots({
      startDate: "2026-08-17",
      endDate: "2026-08-19",
      weekdays: [1, 3],
      startTime: "09:00",
      endTime: "11:00",
      durationMinutes: 60,
    })).toEqual([
      { slotDate: "2026-08-17", startTime: "09:00", endTime: "10:00" },
      { slotDate: "2026-08-17", startTime: "10:00", endTime: "11:00" },
      { slotDate: "2026-08-19", startTime: "09:00", endTime: "10:00" },
      { slotDate: "2026-08-19", startTime: "10:00", endTime: "11:00" },
    ]);
  });

  it("recusa períodos e intervalos inconsistentes", () => {
    expect(() => generateAvailabilitySlots({
      startDate: "2026-08-20",
      endDate: "2026-08-19",
      weekdays: [1],
      startTime: "09:00",
      endTime: "10:00",
      durationMinutes: 60,
    })).toThrow("data final");
  });
});
