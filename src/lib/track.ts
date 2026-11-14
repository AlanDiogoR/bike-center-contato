import { parseNormalizedSearch } from "@/lib/query";

export type OutboundCategory =
  | "whatsapp"
  | "mercado_livre"
  | "maps"
  | "social"
  | "highlight"
  | "review"
  | "pix";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function readCampaignUtms(search: string): Record<string, string> {
  const params = parseNormalizedSearch(search);
  const utms: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params[key];
    if (value) utms[key] = value;
  }
  return utms;
}

export function trackOutboundClick(
  label: string,
  destination: string,
  category: OutboundCategory,
): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({
    event: "outbound_click",
    link_label: label,
    link_destination: destination,
    link_category: category,
    ...readCampaignUtms(window.location.search),
  });
}
