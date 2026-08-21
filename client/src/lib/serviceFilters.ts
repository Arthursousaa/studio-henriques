export const ALL_SERVICE_CATEGORIES = "Todos";

type CategorizedService = { category: string };

export function getServiceCategories<T extends CategorizedService>(services: T[]) {
  return [ALL_SERVICE_CATEGORIES, ...Array.from(new Set(services.map(service => service.category)))];
}

export function filterServicesByCategory<T extends CategorizedService>(services: T[], category: string) {
  return category === ALL_SERVICE_CATEGORIES ? services : services.filter(service => service.category === category);
}
