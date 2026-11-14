import type { Metadata, Viewport } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { buildJsonLd, buildMetadata, serializeJsonLd } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  adjustFontFallback: true,
  preload: true,
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
  variable: "--font-display",
  adjustFontFallback: true,
  preload: false,
});

export const metadata: Metadata = buildMetadata(siteUrl);

export const viewport: Viewport = {
  themeColor: "#fff6e4",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = serializeJsonLd(buildJsonLd(siteUrl));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${sourceSans.variable} ${oswald.variable}`}>
      <body className="bg-paper font-sans text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
