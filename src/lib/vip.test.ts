import { describe, expect, it } from "vitest";
import { PHONE_CLARO, PHONE_VIVO } from "@/lib/links";
import {
  CONSENT_TEXT,
  CONSENT_TEXT_VERSION,
  VIP_ON,
  VIP_OPT_OUT_HREF,
  buildVcard,
  isValidVipInteresse,
  normalizeBrWhatsapp,
  readVipUtms,
} from "./vip";

describe("vip utils", () => {
  describe("VIP_ON e constantes de consentimento", () => {
    it("mantém a flag VIP_ON desligada por padrão", () => {
      expect(VIP_ON).toBe(false);
    });

    it("define versão e texto exato de consentimento LGPD e link SAIR", () => {
      expect(CONSENT_TEXT_VERSION).toBe("vip-v1-2026-11-21");
      expect(CONSENT_TEXT).toBe(
        "Quero receber ofertas e novidades da Bike Center Fartura pelo WhatsApp. Posso sair quando quiser respondendo SAIR.",
      );
      expect(VIP_OPT_OUT_HREF).toBe(`https://wa.me/${PHONE_CLARO}?text=SAIR`);
    });

    it("valida opções de interesse permitidas pelo banco", () => {
      expect(isValidVipInteresse("moto")).toBe(true);
      expect(isValidVipInteresse("bike")).toBe(true);
      expect(isValidVipInteresse("ambos")).toBe(true);
      expect(isValidVipInteresse("carro")).toBe(false);
      expect(isValidVipInteresse("")).toBe(false);
      expect(isValidVipInteresse(null)).toBe(false);
    });
  });

  describe("normalizeBrWhatsapp", () => {
    it("normaliza números de 11 dígitos (celular) com e sem máscara", () => {
      expect(normalizeBrWhatsapp("14991667793")).toBe("+5514991667793");
      expect(normalizeBrWhatsapp("(14) 99166-7793")).toBe("+5514991667793");
      expect(normalizeBrWhatsapp("11 98765 4321")).toBe("+5511987654321");
    });

    it("normaliza números de 10 dígitos (fixo/WhatsApp comercial) com e sem máscara", () => {
      expect(normalizeBrWhatsapp("1433821234")).toBe("+551433821234");
      expect(normalizeBrWhatsapp("(14) 3382-1234")).toBe("+551433821234");
    });

    it("remove prefixo 55 ou 0 inicial quando sobram 10 ou 11 dígitos", () => {
      expect(normalizeBrWhatsapp("+55 (14) 99166-7793")).toBe("+5514991667793");
      expect(normalizeBrWhatsapp("5514991667793")).toBe("+5514991667793");
      expect(normalizeBrWhatsapp("551433821234")).toBe("+551433821234");
      expect(normalizeBrWhatsapp("014991667793")).toBe("+5514991667793");
      expect(normalizeBrWhatsapp("01433821234")).toBe("+551433821234");
      expect(normalizeBrWhatsapp("(014) 99166-7793")).toBe("+5514991667793");
    });

    it("preserva DDD 55 quando o número possui 10 ou 11 dígitos", () => {
      expect(normalizeBrWhatsapp("55991667793")).toBe("+5555991667793");
      expect(normalizeBrWhatsapp("(55) 3222-1234")).toBe("+555532221234");
    });

    it("rejeita números inválidos, curtos, longos ou com DDD fora de 11–99", () => {
      expect(normalizeBrWhatsapp("")).toBeNull();
      expect(normalizeBrWhatsapp("   ")).toBeNull();
      expect(normalizeBrWhatsapp("abc")).toBeNull();
      expect(normalizeBrWhatsapp("991667793")).toBeNull();
      expect(normalizeBrWhatsapp("149916677")).toBeNull();
      expect(normalizeBrWhatsapp("149916677931")).toBeNull();
      expect(normalizeBrWhatsapp("00991667793")).toBeNull();
      expect(normalizeBrWhatsapp("0991667793")).toBeNull();
      expect(normalizeBrWhatsapp("+5509991667793")).toBeNull();
      expect(normalizeBrWhatsapp("10991667793")).toBeNull();
      expect(normalizeBrWhatsapp("+5510991667793")).toBeNull();
    });
  });

  describe("buildVcard", () => {
    it("gera vCard 3.0 com campo N, CRLF em todas as linhas e apenas o WhatsApp Claro", () => {
      const vcard = buildVcard();
      expect(vcard).toBe(
        "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;Bike Center Fartura;;;\r\nFN:Bike Center Fartura\r\nORG:Bike Center Fartura\r\nTEL;TYPE=CELL:+5514991667793\r\nEND:VCARD\r\n",
      );
      expect(vcard).toContain(PHONE_CLARO);
      expect(vcard).not.toContain(PHONE_VIVO);
      expect(vcard).not.toMatch(/(?<!\r)\n/);
      const nLines = vcard
        .split("\r\n")
        .filter((line) => line.startsWith("N:"));
      expect(nLines).toEqual(["N:;Bike Center Fartura;;;"]);
    });
  });

  describe("readVipUtms", () => {
    it("lê utm_source e utm_campaign com trim e limite de 120 caracteres", () => {
      expect(readVipUtms("?utm_source=instagram&utm_campaign=black_friday")).toEqual({
        utm_source: "instagram",
        utm_campaign: "black_friday",
      });
      expect(readVipUtms("")).toEqual({
        utm_source: null,
        utm_campaign: null,
      });
      const longVal = "a".repeat(150);
      const res = readVipUtms(`?utm_source=${longVal}`);
      expect(res.utm_source).toHaveLength(120);
      expect(res.utm_campaign).toBeNull();
    });
  });
});
