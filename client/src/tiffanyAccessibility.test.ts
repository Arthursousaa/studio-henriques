import { describe, expect, it } from "vitest";

function relativeLuminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map(value => Number.parseInt(value, 16) / 255) ?? [];
  const [red, green, blue] = channels.map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const [light, dark] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe("identidade Tiffany acessível", () => {
  it("mantém contraste suficiente nos pares principais de texto e fundo", () => {
    expect(contrastRatio("#fffaf2", "#063f3e")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#0f5f5b", "#f4fffd")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#063f3e", "#e5fbf8")).toBeGreaterThanOrEqual(4.5);
  });
});
