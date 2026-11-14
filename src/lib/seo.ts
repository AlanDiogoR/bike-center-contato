import type { Metadata } from "next";
import {
  googleMapsPlaceLink,
  socialLinks,
  store,
  whatsappSalesLinks,
} from "@/lib/links";

export const siteTitle =
  "Bike Center Fartura-SP | Motos, Bicicletas, Oficina e Peças";

export const siteDescription =
  "Motos, bicicletas, oficina e peças em Fartura/SP. Rua Mário Stella, 355. Seg–Sex 8h–18h · Sáb 8h–13h. WhatsApp (14) 99166-7793 e (14) 99632-5919.";

const keywords = [
  "motos em fartura",
  "loja de bicicletas",
  "comprar moto seminova",
  "bike center fartura",
  "acessórios para motos",
  "peças para motos",
  "oficina de motos fartura",
  "rua mário stella fartura",
];

export function buildMetadata(url: string): Metadata {
  const canonical = `${url}/`;
  return {
    metadataBase: new URL(url),
    title: siteTitle,
    description: siteDescription,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: canonical,
      siteName: "Bike Center Fartura",
      title: siteTitle,
      description: siteDescription,
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 1200,
          alt: "Bike Center Fartura — logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: ["/logo.png"],
    },
    robots: { index: true, follow: true },
  };
}

/** BicycleStore é subtipo de LocalBusiness. Telefones só os já publicados na main. */
export function buildJsonLd(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BicycleStore",
    name: store.name,
    description: store.citation,
    url: `${url}/`,
    image: `${url}/logo.png`,
    telephone: whatsappSalesLinks.map((link) => `+${link.phoneDigits}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address.street,
      addressLocality: store.address.city,
      addressRegion: store.address.state,
      postalCode: store.address.postalCode,
      addressCountry: store.address.country,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: store.hours.weekdayOpens,
        closes: store.hours.weekdayCloses,
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: store.hours.saturdayOpens,
        closes: store.hours.saturdayCloses,
      },
    ],
    hasMap: googleMapsPlaceLink.href,
    geo: {
      "@type": "GeoCoordinates",
      latitude: store.geo.latitude,
      longitude: store.geo.longitude,
    },
    sameAs: socialLinks.map((link) => link.href),
  };
}

/** Evita que um `<` no JSON quebre o `<script>` ou vire HTML. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
