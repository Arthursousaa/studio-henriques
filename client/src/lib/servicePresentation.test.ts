import { describe, expect, it } from "vitest";
import { formatServicePrice } from "./servicePresentation";

describe("formatServicePrice", () => {
  it("exibe maquiagem como sob orçamento quando esse formato está marcado", () => {
    const maquiagem = { name: "Maquiagem", price: "0.00", isPriceOnRequest: true };

    expect(formatServicePrice(maquiagem.price, maquiagem.isPriceOnRequest)).toBe("Sob orçamento");
  });

  it("exibe o valor de um pacote mensal importado corretamente", () => {
    const pacoteBronze = { name: "Pacote Bronze", price: "150.00", isPriceOnRequest: false };

    expect(formatServicePrice(pacoteBronze.price, pacoteBronze.isPriceOnRequest)).toBe("R$ 150,00");
  });
});
