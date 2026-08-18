import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { selectServiceForInfoRequest } from "../lib/infoRequestSelection";
import { filterServicesByCategory } from "../lib/serviceFilters";
import { PublicServiceCard, PublicServiceOptions, type PublicStudioService } from "./Home";

const importedServices: PublicStudioService[] = [
  { id: 14, slug: "make", name: "Maquiagem", category: "Bem-estar", description: "Produção personalizada.", price: "0.00", isPriceOnRequest: true },
  { id: 27, slug: "pacote-bronze", name: "Pacote Bronze", category: "Pacotes mensais", description: "4 mãos e 4 pés.", price: "150.00", isPriceOnRequest: false },
];

describe("catálogo público importado", () => {
  it("mostra maquiagem sob orçamento e pacote mensal na listagem", () => {
    const markup = renderToStaticMarkup(<>{importedServices.map(service => <PublicServiceCard key={service.id} service={service} onSelect={() => undefined} />)}</>);

    expect(markup).toContain("Maquiagem");
    expect(markup).toContain("Sob orçamento");
    expect(markup).toContain("Pacote Bronze");
    expect(markup).toContain("R$ 150,00");
  });

  it("mantém os mesmos valores no seletor de agendamento", () => {
    const markup = renderToStaticMarkup(<select><PublicServiceOptions services={importedServices} /></select>);

    expect(markup).toContain("Maquiagem — Sob orçamento");
    expect(markup).toContain("Pacote Bronze — R$ 150,00");
  });

  it("mantém o serviço escolhido no pedido de informações após filtrar a categoria", () => {
    const bemEstar = filterServicesByCategory(importedServices, "Bem-estar");
    const form = selectServiceForInfoRequest({ serviceId: "", customerName: "Ana", customerPhone: "11999999999", notes: "" }, bemEstar[0].id);

    expect(bemEstar).toHaveLength(1);
    expect(bemEstar[0].name).toBe("Maquiagem");
    expect(form.serviceId).toBe("14");
  });
});
