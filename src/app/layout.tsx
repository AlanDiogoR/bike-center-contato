import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const title = "Bike Center Fartura | Motos, Bicicletas e Acessórios";
const description =
  "A sua loja especializada em motos e bicicletas em Fartura/SP. Venda, compra, troca e a melhor loja no Mercado Livre. Fale com nossos consultores!";

const keywords = [
  "motos em fartura",
  "loja de bicicletas",
  "comprar moto seminova",
  "bike center fartura",
  "acessórios para motos",
];

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Bike Center Fartura",
  description,
  url: siteUrl,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Fartura",
    addressRegion: "SP",
    addressCountry: "BR",
  },
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
        url: "/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "Bike Center Fartura — logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logo.jpeg"],
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
