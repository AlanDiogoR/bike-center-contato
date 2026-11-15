import { describe, expect, it } from "vitest";
import {
  isPlacaUtmSource,
  normalizeQueryKey,
  parseNormalizedSearch,
} from "./query";

describe("normalizeQueryKey", () => {
  it("remove espaços internos, %20 e aplica trim + minúsculas", () => {
    expect(normalizeQueryKey("utm _campaign")).toBe("utm_campaign");
    expect(normalizeQueryKey("utm%20_campaign")).toBe("utm_campaign");
    expect(normalizeQueryKey("UTM_Source")).toBe("utm_source");
    expect(normalizeQueryKey("  UTM_Source  ")).toBe("utm_source");
    expect(normalizeQueryKey("utm%20_source")).toBe("utm_source");
    expect(normalizeQueryKey("UTM%20_Source")).toBe("utm_source");
    expect(normalizeQueryKey("utm+_campaign")).toBe("utm_campaign");
  });

  it("não quebra com sequência de escape inválida", () => {
    expect(normalizeQueryKey("%")).toBe("%");
    expect(normalizeQueryKey("")).toBe("");
  });
});

describe("parseNormalizedSearch", () => {
  it("lê as chaves dos exemplos da placa", () => {
    expect(parseNormalizedSearch("utm _campaign=x")).toEqual({
      utm_campaign: "x",
    });
    expect(parseNormalizedSearch("utm%20_campaign=x")).toEqual({
      utm_campaign: "x",
    });
    expect(parseNormalizedSearch("?UTM_Source=placa")).toEqual({
      utm_source: "placa",
    });
    expect(
      parseNormalizedSearch(
        "?utm_source=placa&utm_medium=nfc&utm_campaign=placa_balcao",
      ),
    ).toEqual({
      utm_source: "placa",
      utm_medium: "nfc",
      utm_campaign: "placa_balcao",
    });
  });

  it("preserva espaços no valor e fica com a primeira chave", () => {
    expect(parseNormalizedSearch("utm_campaign=placa%20balcao")).toEqual({
      utm_campaign: "placa balcao",
    });
    expect(
      parseNormalizedSearch("utm_source=instagram&UTM_Source=placa"),
    ).toEqual({ utm_source: "instagram" });
  });

  it("ignora busca vazia", () => {
    expect(parseNormalizedSearch("")).toEqual({});
    expect(parseNormalizedSearch("?")).toEqual({});
  });
});

describe("isPlacaUtmSource", () => {
  it("reconhece utm_source=placa com chave suja", () => {
    expect(isPlacaUtmSource("?utm_source=placa")).toBe(true);
    expect(isPlacaUtmSource("?UTM_Source=Placa")).toBe(true);
    expect(isPlacaUtmSource("?utm%20_source=placa")).toBe(true);
    expect(isPlacaUtmSource("?utm _source=placa")).toBe(true);
    expect(isPlacaUtmSource("?utm_source=%20placa%20")).toBe(true);
  });

  it("não confunde outras origens nem outra chave", () => {
    expect(isPlacaUtmSource("")).toBe(false);
    expect(isPlacaUtmSource("?utm_source=instagram")).toBe(false);
    expect(isPlacaUtmSource("?utm_campaign=placa")).toBe(false);
    expect(isPlacaUtmSource("?utm_source=placa-balcao")).toBe(false);
    expect(
      isPlacaUtmSource("?utm_medium=nfc&utm_campaign=placa_balcao"),
    ).toBe(false);
  });
});
