export const SALES_MESSAGE_RITA =
  "Olá Rita! Vi o link nas redes da Bike Center e gostaria de ver as motos/bikes disponíveis.";

export const PHONE_CLARO = "5514991667793";
export const PHONE_VIVO = "5514996325919";

export function buildWhatsAppHref(phoneDigits: string): string {
  const params = new URLSearchParams({ text: SALES_MESSAGE_RITA });
  return `https://wa.me/${phoneDigits}?${params.toString()}`;
}

export function formatBrMobileDisplay(phoneDigits: string): string {
  const match = phoneDigits.match(/^55(\d{2})(\d{5})(\d{4})$/);
  if (!match) return phoneDigits;
  const [, ddd, prefix, suffix] = match;
  return `(${ddd}) ${prefix}-${suffix}`;
}

export const store = {
  name: "Bike Center Fartura",
  tagline: "Motos, bicicletas e acessórios em Fartura/SP",
  trustLine: "Há 31 anos em Fartura",
  foundingDate: "1994-11-22",
  city: "Fartura",
  state: "SP",
  address: {
    street: "Rua Mário Stella, 355",
    neighborhood: "Vila Nova",
    city: "Fartura",
    state: "SP",
    country: "BR",
    display: "Rua Mário Stella, 355 — Vila Nova, Fartura/SP",
  },
  hours: {
    display: "Seg–Sex 8h–17h",
    schemaOpens: "08:00",
    schemaCloses: "17:00",
    extraNote: "Outros horários pelo WhatsApp",
  },
} as const;

export const whatsappSalesLinks = [
  {
    id: "claro",
    label: "Vendas e orçamento (Claro)",
    href: buildWhatsAppHref(PHONE_CLARO),
    phoneDigits: PHONE_CLARO,
    phoneDisplay: formatBrMobileDisplay(PHONE_CLARO),
  },
  {
    id: "vivo",
    label: "Oficina e peças (Vivo)",
    href: buildWhatsAppHref(PHONE_VIVO),
    phoneDigits: PHONE_VIVO,
    phoneDisplay: formatBrMobileDisplay(PHONE_VIVO),
  },
] as const;

export const whatsappGroupLink = {
  label: "Grupo WhatsApp — Novidades da loja",
  href: "https://chat.whatsapp.com/CMpFIfBfx5UDumCB77Acdp",
} as const;

const MERCADO_LIVRE_URL_DEFAULT =
  "https://lista.mercadolivre.com.br/_CustId_569984748?item_id=MLB6427585964&category_id=MLB243168&seller_id=569984748&client=recoview-selleritems&recos_listing=true#origin=vip&component=sellerData&typeSeller=classic";

export const mercadoLivreLink = {
  label: "Nossa Loja no Mercado Livre",
  href:
    process.env.NEXT_PUBLIC_MERCADO_LIVRE_URL?.trim() ||
    MERCADO_LIVRE_URL_DEFAULT,
} as const;

export const googleMapsLink = {
  label: "Como chegar — Google Maps",
  href: "https://maps.app.goo.gl/r3otm9rrYUj6jsMu7",
} as const;

export const socialLinks = [
  {
    id: "instagram",
    label: "Nosso Estoque no Instagram",
    shortLabel: "Instagram",
    href: "https://www.instagram.com/bikecenterfartura",
    icon: "instagram" as const,
  },
  {
    id: "tiktok",
    label: "Acelere com a gente no TikTok",
    shortLabel: "TikTok",
    href: "https://www.tiktok.com/@bikecenterfartura",
    icon: "tiktok" as const,
  },
  {
    id: "facebook",
    label: "Siga nossa Página",
    shortLabel: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61576748073943",
    icon: "facebook" as const,
  },
] as const;

const HIGHLIGHT_LABEL =
  process.env.NEXT_PUBLIC_HIGHLIGHT_LABEL?.trim() ?? "";
const HIGHLIGHT_HREF =
  process.env.NEXT_PUBLIC_HIGHLIGHT_HREF?.trim() ?? "";

/** Slot de oferta no topo. Desligado quando label/href estão vazios — sem promo inventada. */
export const highlightOffer = {
  enabled: HIGHLIGHT_LABEL.length > 0 && HIGHLIGHT_HREF.length > 0,
  label: HIGHLIGHT_LABEL,
  href: HIGHLIGHT_HREF,
};
