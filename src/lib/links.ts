export const SALES_MESSAGE_RITA =
  "Olá Rita! Vi o link nas redes da Bike Center e gostaria de ver as motos/bikes disponíveis.";

const PHONE_CLARO = "5514991667793";
const PHONE_VIVO = "5514996325919";

export function buildWhatsAppHref(phoneDigits: string): string {
  const params = new URLSearchParams({ text: SALES_MESSAGE_RITA });
  return `https://wa.me/${phoneDigits}?${params.toString()}`;
}

export const whatsappSalesLinks = [
  {
    id: "claro",
    label: "Conversar no Whats (Claro)",
    href: buildWhatsAppHref(PHONE_CLARO),
  },
  {
    id: "vivo",
    label: "Conversar no Whats (Vivo)",
    href: buildWhatsAppHref(PHONE_VIVO),
  },
] as const;

export const whatsappGroupLink = {
  label: "Grupo WhatsApp — Novidades da loja",
  href: "https://chat.whatsapp.com/CMpFIfBfx5UDumCB77Acdp",
} as const;

function buildMercadoLivreStoreUrl(): string {
  const u = new URL(
    "https://lista.mercadolivre.com.br/_CustId_569984748",
  );
  u.searchParams.set("item_id", "MLB6427585964");
  u.searchParams.set("category_id", "MLB243168");
  u.searchParams.set("seller_id", "569984748");
  u.searchParams.set("client", "recoview-selleritems");
  u.searchParams.set("recos_listing", "true");
  return u.toString();
}

export const mercadoLivreLink = {
  label: "Nossa Loja no Mercado Livre",
  href: buildMercadoLivreStoreUrl(),
} as const;

export const googleMapsLink = {
  label: "Como chegar — Google Maps",
  href: "https://maps.app.goo.gl/r3otm9rrYUj6jsMu7",
} as const;

export const socialLinks = [
  {
    id: "instagram",
    label: "Nosso Estoque no Instagram",
    href: "https://www.instagram.com/bikecenterfartura",
    icon: "instagram" as const,
  },
  {
    id: "tiktok",
    label: "Acelere com a gente no TikTok",
    href: "https://www.tiktok.com/@bikecenterfartura",
    icon: "tiktok" as const,
  },
  {
    id: "facebook",
    label: "Siga nossa Página",
    href: "https://www.facebook.com/profile.php?id=61576748073943",
    icon: "facebook" as const,
  },
] as const;
