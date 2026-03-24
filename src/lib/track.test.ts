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
  });
});
