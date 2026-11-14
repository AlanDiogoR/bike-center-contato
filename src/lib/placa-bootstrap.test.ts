import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { PLACA_BOOTSTRAP_SCRIPT } from "./placa-bootstrap";
import { isPlacaUtmSource } from "./query";

const CASES = [
  "",
  "?",
  "?utm_source=placa",
  "?UTM_Source=Placa",
  "?utm%20_source=placa",
  "?utm _source=placa",
  "?utm_source=%20placa%20",
  "?utm_source=instagram",
  "?utm_campaign=placa",
  "?utm_source=placa&utm_medium=nfc&utm_campaign=placa_balcao",
  "?utm%20_campaign=x&UTM_Source=placa",
  "?utm_source=instagram&UTM_Source=placa",
];

describe("script da variante placa", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-utm-source");
    window.history.pushState({}, "", "/");
  });

  it("concorda com isPlacaUtmSource em todas as queries", () => {
    for (const search of CASES) {
      document.documentElement.removeAttribute("data-utm-source");
      const path = search
        ? `/${search.startsWith("?") ? search : `?${search}`}`
        : "/";
      window.history.pushState({}, "", path);
      window.eval(PLACA_BOOTSTRAP_SCRIPT);
      expect(
        document.documentElement.getAttribute("data-utm-source") === "placa",
        search,
      ).toBe(isPlacaUtmSource(window.location.search));
    }
  });

  it("está ligado no layout e no CSS, antes do conteúdo", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(layout).toMatch(
      /<body[^>]*>\s*<PlacaBootstrapScript\s*\/>\s*<PlacaUtmSync\s*\/>/,
    );
    expect(layout.indexOf("<PlacaBootstrapScript")).toBeLessThan(
      layout.indexOf("{children}"),
    );
    expect(css).toContain(
      'html:not([data-utm-source="placa"]) [data-placa="show"]',
    );
    expect(css).toContain('html[data-utm-source="placa"] [data-placa="hide"]');
    expect(css).toContain("prefers-reduced-motion");
  });
});
