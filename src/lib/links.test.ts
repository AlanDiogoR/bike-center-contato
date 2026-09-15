import { describe, expect, it } from "vitest";
import {
  PHONE_CLARO,
  PHONE_VIVO,
  SALES_MESSAGE_RITA,
  buildWhatsAppHref,
  formatBrMobileDisplay,
  googleMapsLink,
  highlightOffer,
  mercadoLivreLink,
  socialLinks,
  store,
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

  it("mantém dois atalhos de WhatsApp com propósito e os mesmos números", () => {
    expect(whatsappSalesLinks).toHaveLength(2);
    expect(whatsappSalesLinks[0]).toMatchObject({
      id: "claro",
      label: "Vendas e orçamento (Claro)",
      phoneDigits: PHONE_CLARO,
    });
    expect(whatsappSalesLinks[1]).toMatchObject({
      id: "vivo",
      label: "Oficina e peças (Vivo)",
      phoneDigits: PHONE_VIVO,
    });
    whatsappSalesLinks.forEach((l) => {
      expect(l.href).toBe(buildWhatsAppHref(l.phoneDigits));
      expect(l.href).toMatch(/^https:\/\/wa\.me\//);
    });
  });

  it("expõe grupo do WhatsApp, Mercado Livre, Google Maps e redes sociais", () => {
    expect(whatsappGroupLink.href).toContain("chat.whatsapp.com");
    const ml = new URL(mercadoLivreLink.href);
    expect(ml.hostname).toBe("lista.mercadolivre.com.br");
    expect(ml.searchParams.get("seller_id")).toBe("569984748");
    expect(googleMapsLink.href).toBe("https://maps.app.goo.gl/r3otm9rrYUj6jsMu7");
    expect(socialLinks.map((s) => s.id)).toEqual([
      "instagram",
      "tiktok",
      "facebook",
    ]);
  });

  it("expõe endereço e horário da loja física sem inventar sábado", () => {
    expect(store.address.street).toBe("Rua Mário Stella, 355");
    expect(store.address.display).toContain("Vila Nova");
    expect(store.address.display).toContain("Fartura/SP");
    expect(store.hours.display).toBe("Seg–Sex 8h–17h");
    expect(store.hours.display.toLowerCase()).not.toMatch(/s[aá]b/);
    expect(store.trustLine).toBe("Há 31 anos em Fartura");
  });

  it("formata telefones brasileiros para NAP", () => {
    expect(formatBrMobileDisplay(PHONE_CLARO)).toBe("(14) 99166-7793");
    expect(formatBrMobileDisplay(PHONE_VIVO)).toBe("(14) 99632-5919");
  });

  it("deixa o slot de oferta desligado por padrão", () => {
    expect(highlightOffer.enabled).toBe(false);
    expect(highlightOffer.label).toBe("");
    expect(highlightOffer.href).toBe("");
  });
});
