import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import nextConfig from "../../next.config.mjs";
import { DEFAULT_SITE_URL, getSiteUrl } from "./site";

describe("getSiteUrl", () => {
  it("usa a URL pública quando a env não existe", () => {
    expect(getSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(getSiteUrl("")).toBe(DEFAULT_SITE_URL);
  });

  it("nunca devolve localhost", () => {
    expect(getSiteUrl("http://localhost:3000")).toBe(DEFAULT_SITE_URL);
    expect(getSiteUrl("lixo")).toBe(DEFAULT_SITE_URL);
  });

  it("respeita a env válida e remove barra final", () => {
    expect(getSiteUrl("https://exemplo.com/")).toBe("https://exemplo.com");
  });

  it("robots e sitemap não contêm localhost", () => {
    const out = JSON.stringify([robots(), sitemap()]);
    expect(out).not.toContain("localhost");
    expect(out).toContain(DEFAULT_SITE_URL);
  });
});

describe("raiz da placa", () => {
  it("não redireciona / e portanto preserva a query da NFC", async () => {
    const redirects = await nextConfig.redirects();
    expect(redirects.map((rule) => rule.source)).not.toContain("/");
    expect(redirects.map((rule) => rule.source)).toContain("/favicon.ico");
  });
});
