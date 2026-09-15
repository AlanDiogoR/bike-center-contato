import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { googleMapsLink, store, whatsappSalesLinks } from "@/lib/links";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const title = "Bike Center Fartura | Motos, Bicicletas e Acessórios";
const description =
  "Motos, bicicletas e acessórios em Fartura/SP. Rua Mário Stella, 355 — Vila Nova. Seg–Sex 8h–17h. WhatsApp para vendas, orçamento, oficina e peças.";

const keywords = [
  "motos em fartura",
  "loja de bicicletas",
  "comprar moto seminova",
  "bike center fartura",
  "acessórios para motos",
  "rua mário stella fartura",
  "oficina de motos fartura",
];

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: store.name,
  description,
  url: siteUrl,
  foundingDate: store.foundingDate,
  telephone: whatsappSalesLinks.map((link) => `+${link.phoneDigits}`),
  address: {
    "@type": "PostalAddress",
    streetAddress: `${store.address.street} — ${store.address.neighborhood}`,
    addressLocality: store.address.city,
    addressRegion: store.address.state,
    addressCountry: store.address.country,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ],
    opens: store.hours.schemaOpens,
    closes: store.hours.schemaCloses,
  },
  hasMap: googleMapsLink.href,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Bike Center Fartura",
    title,
    description,
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
    title,
    description,
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans text-zinc-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
