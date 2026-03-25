import { describe, expect, it } from "vitest";
import {
  SALES_MESSAGE_RITA,
  buildWhatsAppHref,
  googleMapsLink,
  mercadoLivreLink,
  socialLinks,
  whatsappGroupLink,
  whatsappSalesLinks,
} from "./links";

describe("links", () => {
  it("inclui Rita na mensagem de vendas", () => {
    expect(SALES_MESSAGE_RITA).toContain("Rita");
    expect(SALES_MESSAGE_RITA).toContain("Bike Center");
  });

  it("gera URLs de WhatsApp com texto codificado", () => {
    const href = buildWhatsAppHref("5514991667793");
    expect(href).toMatch(/^https:\/\/wa\.me\/5514991667793\?/);
    const u = new URL(href);
    expect(u.searchParams.get("text")).toBe(SALES_MESSAGE_RITA);
  });

  it("mantém dois atalhos de WhatsApp de vendas", () => {
    expect(whatsappSalesLinks).toHaveLength(2);
    whatsappSalesLinks.forEach((l) => {
      expect(l.href).toMatch(/^https:\/\/wa\.me\//);
    });
  });

  it("expõe grupo do WhatsApp, Mercado Livre, Google Maps e redes sociais", () => {
    expect(whatsappGroupLink.href).toContain("chat.whatsapp.com");
    const ml = new URL(mercadoLivreLink.href);
    expect(ml.hostname).toBe("lista.mercadolivre.com.br");
    expect(ml.searchParams.get("seller_id")).toBe("569984748");
    expect(ml.hash).toBe("");
    expect(googleMapsLink.href).toContain("maps.app.goo.gl");
    expect(socialLinks.map((s) => s.id)).toEqual([
      "instagram",
      "tiktok",
      "facebook",
    ]);
  });
});
