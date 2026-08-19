import { describe, expect, it } from "vitest";

describe("Credencial Cloudflare", () => {
  it("valida o token configurado na API oficial da Cloudflare", async () => {
    const token = process.env.CLOUDFLARE_API_TOKEN;

    expect(token).toBeTruthy();

    const response = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = (await response.json()) as {
      success?: boolean;
      result?: { status?: string };
    };

    expect(response.ok).toBe(true);
    expect(payload.success).toBe(true);
    expect(payload.result?.status).toBe("active");
  });
});
