import { describe, expect, it } from "vitest";
import {
  PIX_GUI,
  PIX_KEY,
  PIX_MERCHANT_CITY,
  PIX_MERCHANT_NAME,
  PIX_TXID,
  buildPixPayload,
  crc16CcittFalse,
  parsePixAmountDigits,
} from "./pix";

describe("crc16CcittFalse", () => {
  it("confere o vetor 123456789 = 29B1", () => {
    expect(crc16CcittFalse("123456789")).toBe("29B1");
  });
});

describe("buildPixPayload", () => {
  it("fixa nome, cidade, chave e txid do brief, sem CNPJ", () => {
    expect(PIX_MERCHANT_NAME).toBe("BIKE CENTER COM BIC LTDA");
    expect(PIX_MERCHANT_NAME).toHaveLength(24);
    expect(PIX_MERCHANT_CITY).toBe("FARTURA");
    expect(PIX_KEY).toBe("+5514996542733");
    expect(PIX_GUI).toBe("br.gov.bcb.pix");
    expect(PIX_TXID).toBe("***");
  });

  it("omite o campo 54 quando não há valor", () => {
    const payload = buildPixPayload(null);
    expect(payload).toContain(
      "26360014br.gov.bcb.pix0114+55149965427335204000053039865802BR5924BIKE CENTER COM BIC LTDA6007FARTURA62070503***6304",
    );
    expect(payload).toContain("53039865802BR");
    expect(payload.startsWith("000201010211")).toBe(true);
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
    expect(payload).not.toMatch(/CNPJ/i);
  });

  it("inclui R$ 10,00 como 10.00 e recalcula o CRC", () => {
    const withAmount = buildPixPayload("10.00");
    const without = buildPixPayload();
    expect(withAmount).toContain("540510.00");
    expect(withAmount).toContain(
      "5303986540510.005802BR5924BIKE CENTER COM BIC LTDA6007FARTURA62070503***6304",
    );
    expect(withAmount.slice(-4)).not.toBe(without.slice(-4));
    expect(crc16CcittFalse(withAmount.slice(0, -4))).toBe(withAmount.slice(-4));
  });

  it("rejeita valor zero ou mal formatado", () => {
    expect(() => buildPixPayload("0.00")).toThrow(/inválido/i);
    expect(() => buildPixPayload("10")).toThrow(/inválido/i);
    expect(() => buildPixPayload("10,00")).toThrow(/inválido/i);
  });
});

describe("parsePixAmountDigits", () => {
  it("deixa o valor em branco sem erro", () => {
    expect(parsePixAmountDigits("")).toEqual({
      display: "",
      amount: null,
      error: null,
    });
  });

  it("formata 1000 como R$ 10,00", () => {
    expect(parsePixAmountDigits("1000")).toEqual({
      display: "10,00",
      amount: "10.00",
      error: null,
    });
    expect(parsePixAmountDigits("R$ 10,00").amount).toBe("10.00");
  });

  it("recusa zero", () => {
    expect(parsePixAmountDigits("0").error).toMatch(/maior que zero/i);
    expect(parsePixAmountDigits("0").amount).toBeNull();
  });
});
