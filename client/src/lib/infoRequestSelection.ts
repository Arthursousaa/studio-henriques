export function selectServiceForInfoRequest<T extends { serviceId: string }>(form: T, serviceId: number): T {
  return { ...form, serviceId: String(serviceId) };
}
