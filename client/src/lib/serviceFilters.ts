import type { PublicStudioService } from "@/pages/Home";

export const ALL_SERVICE_CATEGORIES = "Todos";

export function getServiceCategories(services: PublicStudioService[]) {
  return [ALL_SERVICE_CATEGORIES, ...Array.from(new Set(services.map(service => service.category)))];
}

export function filterServicesByCategory(services: PublicStudioService[], category: string) {
  return category === ALL_SERVICE_CATEGORIES ? services : services.filter(service => service.category === category);
}
