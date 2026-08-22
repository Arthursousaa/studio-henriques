import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(process.cwd());

describe("compatibilidade móvel da publicação Cloudflare", () => {
  it("gera uma versão legada para Safari e não depende do script externo de analytics", () => {
    const cloudflareConfig = readFileSync(resolve(projectRoot, "vite.cloudflare.config.ts"), "utf8");
    const htmlTemplate = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");
    const tiffanyStyles = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");

    expect(cloudflareConfig).toContain('@vitejs/plugin-legacy');
    expect(cloudflareConfig).toContain('iOS >= 12');
    expect(htmlTemplate).not.toContain("manus-analytics.com");
    expect(htmlTemplate).not.toContain("VITE_ANALYTICS_ENDPOINT");
    expect(tiffanyStyles).toContain("--studio-tiffany");
    expect(tiffanyStyles).toContain("--studio-tiffany-deep");
  });
});
