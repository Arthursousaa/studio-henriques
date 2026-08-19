import { describe, expect, it } from "vitest";
import { hashPassword, slugify, verifyPassword } from "./worker";

describe("utilitários da versão Cloudflare", () => {
  it("cria slugs estáveis sem acentuação para os serviços", () => {
    expect(slugify("Massagem com ventosa")).toBe("massagem-com-ventosa");
    expect(slugify("Plástica dos pés")).toBe("plastica-dos-pes");
  });

  it("protege a senha e valida somente a senha correta", async () => {
    const stored = await hashPassword("uma-senha-segura-123");

    expect(stored).not.toContain("uma-senha-segura-123");
    await expect(verifyPassword("uma-senha-segura-123", stored)).resolves.toBe(true);
    await expect(verifyPassword("senha-incorreta-123", stored)).resolves.toBe(false);
  });
});
