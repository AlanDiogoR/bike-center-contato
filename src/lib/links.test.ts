import { describe, expect, it } from "vitest";
import {
  PHONE_CLARO,
  PHONE_VIVO,
  SALES_MESSAGE_RITA,
  buildWhatsAppHref,
  formatBrMobileDisplay,
  googleMapsLink,
  googleMapsPlaceLink,
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

  it("mantém dois atalhos de WhatsApp Claro/Vivo e os mesmos números", () => {
    expect(whatsappSalesLinks).toHaveLength(2);
    expect(whatsappSalesLinks[0]).toMatchObject({
      id: "claro",
      label: "Conversar no Whats (Claro)",
      phoneDigits: PHONE_CLARO,
    });
    expect(whatsappSalesLinks[1]).toMatchObject({
      id: "vivo",
      label: "Conversar no Whats (Vivo)",
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
    const maps = new URL(googleMapsLink.href);
    expect(maps.hostname).toBe("www.google.com");
    expect(maps.pathname).toBe("/maps/dir/");
    expect(maps.searchParams.get("api")).toBe("1");
    expect(maps.searchParams.get("destination")).toBe("-23.3883268,-49.5062797");
    expect(googleMapsLink.href).not.toContain("maps.app.goo.gl");
    expect(googleMapsLink.href).not.toContain("destination=Rua");
    expect(googleMapsLink.href.toLowerCase()).not.toContain("procópio");
    expect(googleMapsLink.href.toLowerCase()).not.toContain("procopio");
    expect(googleMapsPlaceLink.href).toContain("Bike+Center+Fartura");
    expect(googleMapsPlaceLink.href).toContain("-23.3883268,-49.5062797");
    expect(socialLinks.map((s) => s.id)).toEqual([
      "instagram",
      "tiktok",
      "facebook",
    ]);
  });

  it("expõe endereço e horário confirmados pelo dono da loja", () => {
    expect(store.address.street).toBe("Rua Mário Stella, 355");
    expect(store.address.display).toBe("Rua Mário Stella, 355 · Fartura/SP");
    expect(store.address.display).not.toMatch(/Vila Nova/i);
    expect(store.hours.display).toBe("Seg–Sex 8h–18h · Sáb 8h–13h");
    expect(store.hours.display).not.toMatch(/17h|12h/);
    expect(store.trustLine).toBe("Há mais de 30 anos em Fartura");
    expect(store).not.toHaveProperty("foundingDate");
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
