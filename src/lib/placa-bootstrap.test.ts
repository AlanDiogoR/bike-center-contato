import { existsSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { PLACA_BOOTSTRAP_SCRIPT, UTM_SOURCE_ALLOWLIST } from "./placa-bootstrap";
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
  "?utm_source=%E0%A4%A",
  "?%E0%A4%A=placa&utm_source=placa",
  "?utm_source=placa%22%3E%3Cscript%3Ealert(1)%3C/script%3E",
  "?utm_source=%3Cimg%20src=x%20onerror=alert(1)%3E",
  "?utm_source=__proto__",
  "?utm_source=hasOwnProperty",
];

function runAt(search: string) {
  const path = search
    ? `/${search.startsWith("?") ? search : `?${search}`}`
    : "/";
  window.history.pushState({}, "", path);
  window.eval(PLACA_BOOTSTRAP_SCRIPT);
  return document.documentElement.getAttribute("data-utm-source");
}

describe("script da variante placa", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-utm-source");
    window.history.pushState({}, "", "/");
  });

  it("concorda com isPlacaUtmSource em todas as queries", () => {
    for (const search of CASES) {
      document.documentElement.removeAttribute("data-utm-source");
      const attr = runAt(search);
      expect(attr === "placa", search).toBe(
        isPlacaUtmSource(window.location.search),
      );
    }
  });

  it("concorda com isPlacaUtmSource em chaves e valores aleatórios", () => {
    const pieces = [
      "utm", "UTM", "_", "source", "Source", "%20", "%2B", "%25", "%",
      "2", "0", " ", "+", "\t", "%09", "%E0", "s", "=", "&", "placa",
      "PLACA", "insta", "",
    ];
    let seed = 42;
    const rnd = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    const word = (max: number) =>
      Array.from({ length: 1 + rnd(max) }, () => pieces[rnd(pieces.length)]).join("");
    for (let i = 0; i < 400; i++) {
      const pairs = Array.from(
        { length: 1 + rnd(3) },
        () => `${rnd(2) ? "utm_source" : word(5)}=${rnd(2) ? "placa" : word(3)}`,
      );
      document.documentElement.removeAttribute("data-utm-source");
      const attr = runAt(`?${pairs.join("&")}`);
      expect(attr === "placa", window.location.search).toBe(
        isPlacaUtmSource(window.location.search),
      );
    }
  });

  it("cabe no orçamento de bytes do documento", () => {
    // O texto entra duas vezes no HTML (tag + payload RSC); manter enxuto
    // preserva o LCP (HTML dentro da janela inicial do TCP).
    expect(PLACA_BOOTSTRAP_SCRIPT.length).toBeLessThanOrEqual(350);
    expect(PLACA_BOOTSTRAP_SCRIPT).not.toContain('"');
  });

  it("só escreve no DOM valores da allowlist", () => {
    expect(UTM_SOURCE_ALLOWLIST).toEqual(["placa"]);
    expect(PLACA_BOOTSTRAP_SCRIPT).toContain(
      `[${UTM_SOURCE_ALLOWLIST.map((v) => `'${v}'`).join(",")}].includes(s)?`,
    );
    for (const search of CASES) {
      document.documentElement.removeAttribute("data-utm-source");
      const attr = runAt(search);
      expect(
        attr === null || (UTM_SOURCE_ALLOWLIST as readonly string[]).includes(attr),
        search,
      ).toBe(true);
    }
  });

  it("remove um atributo antigo quando a query não é da placa", () => {
    document.documentElement.setAttribute("data-utm-source", "placa");
    expect(runAt("?utm_source=instagram")).toBeNull();
    document.documentElement.setAttribute("data-utm-source", "x");
    expect(runAt("")).toBeNull();
  });

  it("é texto fixo, sem nada da query interpolado", () => {
    window.history.pushState({}, "", "/?utm_source=placa&x=%3Cb%3E");
    const before = PLACA_BOOTSTRAP_SCRIPT;
    // O módulo não lê location na importação: o texto não depende da URL.
    expect(PLACA_BOOTSTRAP_SCRIPT).toBe(before);
    expect(PLACA_BOOTSTRAP_SCRIPT).toMatch(
      /new URLSearchParams\((window\.)?location\.search\)/,
    );
    expect(PLACA_BOOTSTRAP_SCRIPT).not.toMatch(/innerHTML|document\.write|eval\(/);
    expect(PLACA_BOOTSTRAP_SCRIPT).not.toContain("${");
  });

  it("está ligado no layout e no CSS, antes do conteúdo, sem componente cliente extra", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(layout).toMatch(/<body[^>]*>\s*<PlacaBootstrapScript\s*\/>/);
    expect(layout).not.toContain("PlacaUtmSync");
    expect(layout).not.toMatch(/searchParams|useSearchParams|headers\(\)/);
    expect(existsSync("src/components/PlacaUtmSync.tsx")).toBe(false);
    expect(layout.indexOf("<PlacaBootstrapScript")).toBeLessThan(
      layout.indexOf("{children}"),
    );
    const bootstrap = readFileSync(
      "src/components/PlacaBootstrapScript.tsx",
      "utf8",
    );
    expect(bootstrap).not.toContain('"use client"');
    expect(bootstrap).toContain("__html: PLACA_BOOTSTRAP_SCRIPT");
    expect(css).toContain(
      'html:not([data-utm-source="placa"]) [data-placa="show"]',
    );
    expect(css).toContain('html[data-utm-source="placa"] [data-placa="hide"]');
    expect(css).toContain("prefers-reduced-motion");
  });
});
