export function trackOutboundClick(
  label: string,
  destination: string,
  category: "whatsapp" | "mercado_livre" | "maps" | "social",
): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({
    event: "outbound_click",
    link_label: label,
    link_destination: destination,
    link_category: category,
  });
}
