import { describe, expect, it } from "vitest";
import { ALL_SERVICE_CATEGORIES, filterServicesByCategory, getServiceCategories } from "./serviceFilters";

const services = [
  { id: 1, slug: "massagem-ventosa", name: "Massagem com ventosa", category: "Massagem", description: "", price: "90.00", isPriceOnRequest: false },
  { id: 2, slug: "massagem-relaxante", name: "Massagem relaxante", category: "Massagem", description: "", price: "80.00", isPriceOnRequest: false },
  { id: 3, slug: "manicure", name: "Manicure", category: "Unhas", description: "", price: "30.00", isPriceOnRequest: false },
];

describe("filtros de serviços", () => {
  it("organiza as categorias sem repetir opções", () => {
    expect(getServiceCategories(services)).toEqual([ALL_SERVICE_CATEGORIES, "Massagem", "Unhas"]);
  });

  it("exibe apenas os serviços da categoria escolhida", () => {
    expect(filterServicesByCategory(services, "Massagem").map(service => service.name)).toEqual(["Massagem com ventosa", "Massagem relaxante"]);
    expect(filterServicesByCategory(services, ALL_SERVICE_CATEGORIES)).toHaveLength(3);
  });
});
