import { describe, expect, it } from "vitest";

describe("Credencial Cloudflare", () => {
  it("valida o token configurado na API oficial da Cloudflare", async () => {
    const token = process.env.CLOUDFLARE_API_TOKEN;

    expect(token).toBeTruthy();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let response: Response;

    try {
      response = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await response.json()) as {
      success?: boolean;
      result?: { status?: string };
    };

    expect(response.ok).toBe(true);
    expect(payload.success).toBe(true);
    expect(payload.result?.status).toBe("active");
  }, 15_000);
});
