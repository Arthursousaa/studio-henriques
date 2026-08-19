export function selectServiceForInfoRequest<T extends { serviceId: string }>(form: T, serviceId: number, extra: Partial<T> = {}): T {
  return { ...form, ...extra, serviceId: String(serviceId) };
}

export function buildInfoRequestNotes(notes: string, depilationMethod?: "Cera" | "Laser") {
  const preference = depilationMethod ? `Preferência para depilação: ${depilationMethod}.` : "";
  return [preference, notes.trim()].filter(Boolean).join("\n\n") || undefined;
}
