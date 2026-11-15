import { beforeEach, describe, expect, it } from "vitest";
import { trackOutboundClick } from "./track";

describe("trackOutboundClick", () => {
  beforeEach(() => {
    const w = window as Window & { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = [];
  });

  it("envia evento ao dataLayer", () => {
    const w = window as Window & { dataLayer: Record<string, unknown>[] };

    trackOutboundClick("Teste", "https://example.com", "whatsapp");

    expect(w.dataLayer).toHaveLength(1);
    expect(w.dataLayer[0]).toMatchObject({
      event: "outbound_click",
      link_label: "Teste",
      link_destination: "https://example.com",
      link_category: "whatsapp",
    });
    expect(w.dataLayer[0]).not.toHaveProperty("utm_source");
  });

  it("anexa os UTMs da placa ao evento de clique", () => {
    window.history.pushState(
      {},
      "",
      "/?utm_source=placa&utm_medium=nfc&utm_campaign=placa_balcao&ignored=1",
    );
    const w = window as Window & { dataLayer: Record<string, unknown>[] };

    trackOutboundClick(
      "Avalie a Bike Center no Google",
      "https://www.google.com/maps",
      "review",
    );

    expect(w.dataLayer[0]).toMatchObject({
      event: "outbound_click",
      link_category: "review",
      utm_source: "placa",
      utm_medium: "nfc",
      utm_campaign: "placa_balcao",
    });
    expect(w.dataLayer[0]).not.toHaveProperty("ignored");
  });

  it("anexa UTMs mesmo com chave suja (espaço, %20 ou maiúsculas)", () => {
    window.history.pushState(
      {},
      "",
      "/?UTM_Source=placa&utm%20_medium=nfc&utm%20_campaign=placa_balcao",
    );
    const w = window as Window & { dataLayer: Record<string, unknown>[] };

    trackOutboundClick("Avaliar no Google", "https://www.google.com/maps", "review");

    expect(w.dataLayer[0]).toMatchObject({
      utm_source: "placa",
      utm_medium: "nfc",
      utm_campaign: "placa_balcao",
    });
  });
});
