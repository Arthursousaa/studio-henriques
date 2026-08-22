import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("foto da capa pública", () => {
  it("usa uma URL pública de imagem em vez de um caminho manus-storage indisponível no Worker", () => {
    const homePage = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

    expect(homePage).toContain("https://images.unsplash.com/photo-1604654894610-df63bc536371");
    expect(homePage).not.toContain("studio-henriques-hero_d71539bc.jpg");
  });
});
