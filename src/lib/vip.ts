import { PHONE_CLARO } from "@/lib/links";
import { parseNormalizedSearch } from "@/lib/query";

/**
 * Comparação literal para que o Next/SWC inline as variáveis no build
 * e elimine o ramo inteiro quando a flag estiver desligada.
 */
export const VIP_ON =
  process.env.NEXT_PUBLIC_VIP_ENABLED === "true" &&
  !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export const CONSENT_TEXT_VERSION = "vip-v1-2026-11-21";

export const CONSENT_TEXT =
  "Quero receber ofertas e novidades da Bike Center Fartura pelo WhatsApp. Posso sair quando quiser respondendo SAIR.";

export const VIP_OPT_OUT_HREF = `https://wa.me/${PHONE_CLARO}?text=SAIR`;

export const VIP_STORAGE_KEY = "vip_cadastrado";

export const TURNSTILE_ACTION = "vip_signup";

export const VCARD_FILENAME = "bike-center-fartura.vcf";
export const VCARD_MIME = "text/vcard;charset=utf-8";

export const VIP_INTERESSES = ["moto", "bike", "ambos"] as const;
export type VipInteresse = (typeof VIP_INTERESSES)[number];

export const WHATSAPP_E164_RE = /^\+55[1-9][0-9]{9,10}$/;

export function isValidVipInteresse(value: unknown): value is VipInteresse {
  return (
    typeof value === "string" &&
    (VIP_INTERESSES as readonly string[]).includes(value)
  );
}

/**
 * Normaliza telefone brasileiro para E.164 (+55 + 10 ou 11 dígitos):
 * - Remove não dígitos;
 * - Remove prefixo 55 ou 0 inicial quando sobrarem 10 ou 11 dígitos;
 * - Valida DDD entre 11 e 99;
 * - Retorna string compatível com ^\+55[1-9][0-9]{9,10}$ ou null.
 */
export function normalizeBrWhatsapp(input: string): string | null {
  if (typeof input !== "string") return null;
  let digits = input.replace(/\D/g, "");

  if (
    digits.startsWith("55") &&
    (digits.length === 12 || digits.length === 13)
  ) {
    digits = digits.slice(2);
  } else if (
    digits.startsWith("0") &&
    (digits.length === 11 || digits.length === 12)
  ) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10 && digits.length !== 11) return null;

  const ddd = Number(digits.slice(0, 2));
  if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) return null;

  const e164 = `+55${digits}`;
  return WHATSAPP_E164_RE.test(e164) ? e164 : null;
}

/**
 * Gera vCard 3.0 com CRLF e exclusivamente o número do WhatsApp Claro.
 */
export function buildVcard(): string {
  return (
    [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:;Bike Center Fartura;;;",
      "FN:Bike Center Fartura",
      "ORG:Bike Center Fartura",
      `TEL;TYPE=CELL:+${PHONE_CLARO}`,
      "END:VCARD",
    ].join("\r\n") + "\r\n"
  );
}

export function downloadVcard(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const vcard = buildVcard();
  const blob = new Blob([vcard], { type: VCARD_MIME });
  if (typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = VCARD_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

export function readVipUtms(search: string): {
  utm_source: string | null;
  utm_campaign: string | null;
} {
  const params = parseNormalizedSearch(search);
  const rawSource =
    typeof params.utm_source === "string" ? params.utm_source.trim() : "";
  const rawCampaign =
    typeof params.utm_campaign === "string" ? params.utm_campaign.trim() : "";
  return {
    utm_source: rawSource ? rawSource.slice(0, 120) : null,
    utm_campaign: rawCampaign ? rawCampaign.slice(0, 120) : null,
  };
}
