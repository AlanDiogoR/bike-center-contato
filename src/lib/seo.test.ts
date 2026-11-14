import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PNG } from "pngjs";
import { PHONE_CLARO, PHONE_VIVO, googleMapsPlaceLink, store } from "./links";
import { PIX_KEY } from "./pix";
import {
  buildJsonLd,
  buildMetadata,
  serializeJsonLd,
  siteDescription,
  siteTitle,
} from "./seo";
import { DEFAULT_SITE_URL } from "./site";

describe("SEO local", () => {
  it("fixa canonical de produção sem UTM", () => {
    const metadata = buildMetadata(DEFAULT_SITE_URL);
    expect(metadata.alternates?.canonical).toBe(`${DEFAULT_SITE_URL}/`);
    expect(String(metadata.alternates?.canonical)).not.toContain("utm_");
    expect(metadata.title).toBe(siteTitle);
    expect(metadata.description).toBe(siteDescription);
    expect(siteTitle).toMatch(/Fartura/);
    expect(siteDescription).toMatch(/oficina/i);
    expect(siteDescription).toMatch(/peças/i);
    expect(siteDescription).toContain("(14) 99166-7793");
    expect(siteDescription).toContain("(14) 99632-5919");
    expect(siteDescription).not.toContain("99654-2733");
  });

  it("publica BicycleStore só com telefones da main", () => {
    const json = JSON.stringify(buildJsonLd(DEFAULT_SITE_URL));
    const data = buildJsonLd(DEFAULT_SITE_URL);
    expect(data["@type"]).toBe("BicycleStore");
    expect(data.telephone).toEqual([`+${PHONE_CLARO}`, `+${PHONE_VIVO}`]);
    expect(data.address.streetAddress).toBe(store.address.street);
    expect(data.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: store.geo.latitude,
      longitude: store.geo.longitude,
    });
    expect(data.hasMap).toBe(googleMapsPlaceLink.href);
    expect(data.sameAs).toContain("https://www.instagram.com/bikecenterfartura");
    expect(data.sameAs).toContain(
      "https://www.facebook.com/profile.php?id=61576748073943",
    );
    expect(data.sameAs).not.toContain("https://www.facebook.com/590373650835991");
    expect(json).not.toContain(PIX_KEY);
    expect(json).not.toContain("99654-2733");
    expect(json).not.toMatch(/cnpj/i);
    expect(data.description).toBe(store.citation);
    expect(data.address.postalCode).toBe("18870-712");
    expect(json).not.toContain("18870-000");
  });

  it("declara og:image 1200×630 igual ao arquivo", () => {
    const png = PNG.sync.read(readFileSync("public/og.png"));
    expect(png.width).toBe(1200);
    expect(png.height).toBe(630);
    const metadata = buildMetadata(DEFAULT_SITE_URL);
    const images = metadata.openGraph?.images;
    const image = Array.isArray(images) ? images[0] : images;
    expect(image).toMatchObject({
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "Bike Center Fartura — Fartura/SP",
    });
    const twitterImages = metadata.twitter?.images;
    const twitterImage = Array.isArray(twitterImages)
      ? twitterImages[0]
      : twitterImages;
    expect(twitterImage).toMatchObject({
      url: "/og.png",
      width: 1200,
      height: 630,
    });
    const apple = PNG.sync.read(readFileSync("src/app/apple-icon.png"));
    expect(apple.width).toBe(180);
    expect(apple.height).toBe(180);
  });

  it("escapa < no JSON-LD para não fechar o script", () => {
    const raw = serializeJsonLd({ note: "a<b" });
    expect(raw).not.toContain("<");
    expect(raw).toContain("\\u003c");
    expect(JSON.parse(raw)).toEqual({ note: "a<b" });
  });
});
