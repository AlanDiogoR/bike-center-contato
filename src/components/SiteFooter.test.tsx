import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";
import { googleMapsPlaceLink, store, whatsappSalesLinks } from "@/lib/links";

describe("SiteFooter", () => {
  it("renderiza os blocos de endereço, horários (com domingo fechado) e WhatsApp Claro/Vivo com NAP de links.ts", () => {
    const { container } = render(<SiteFooter />);

    expect(screen.getByText(store.name)).toBeInTheDocument();
    expect(screen.getByText(store.footerTagline)).toBeInTheDocument();

    const mapsLink = screen.getByRole("link", {
      name: `${store.address.street} CEP ${store.address.postalCode} — ${store.city}/${store.state} Ver no Google Maps`,
    });
    expect(mapsLink).toHaveAttribute("href", googleMapsPlaceLink.href);
    expect(mapsLink.getAttribute("href")).toContain("Bike+Center+Fartura");
    expect(mapsLink.getAttribute("href")).toContain(
      "0x94c1a51538905ff9:0x7771bcda03c58d75",
    );
    expect(mapsLink.getAttribute("href")).not.toContain("!9m1!1b1");
    expect(mapsLink.getAttribute("href")).not.toContain("/place//");
    expect(mapsLink.getAttribute("href")).not.toContain("/maps/place//");
    expect(mapsLink.className).toMatch(/min-h-11/);
    expect(within(mapsLink).getByText(store.address.street)).toBeInTheDocument();
    expect(
      within(mapsLink).getByText(
        `CEP ${store.address.postalCode} — ${store.city}/${store.state}`,
      ),
    ).toBeInTheDocument();
    expect(within(mapsLink).getByText("Ver no Google Maps")).toBeInTheDocument();

    const hoursRegion = screen.getByRole("region", { name: "Horários" });
    expect(within(hoursRegion).getByText("Seg–Sex")).toBeInTheDocument();
    expect(within(hoursRegion).getByText("8h–18h")).toBeInTheDocument();
    expect(within(hoursRegion).getByText("Sábado")).toBeInTheDocument();
    expect(within(hoursRegion).getByText("8h–13h")).toBeInTheDocument();
    expect(within(hoursRegion).getByText("Domingo")).toBeInTheDocument();
    expect(within(hoursRegion).getByText("Fechado")).toBeInTheDocument();

    const claro = screen.getByRole("link", {
      name: "WhatsApp Claro (14) 99166-7793, abre conversa no WhatsApp",
    });
    expect(claro).toHaveAttribute("href", whatsappSalesLinks[0].href);
    expect(claro.className).toMatch(/min-h-11/);
    expect(within(claro).getByText("WhatsApp Claro")).toBeInTheDocument();
    expect(within(claro).getByText("(14) 99166-7793")).toBeInTheDocument();

    const vivo = screen.getByRole("link", {
      name: "WhatsApp Vivo (14) 99632-5919, abre conversa no WhatsApp",
    });
    expect(vivo).toHaveAttribute("href", whatsappSalesLinks[1].href);
    expect(vivo.className).toMatch(/min-h-11/);
    expect(within(vivo).getByText("WhatsApp Vivo")).toBeInTheDocument();
    expect(within(vivo).getByText("(14) 99632-5919")).toBeInTheDocument();

    container.querySelectorAll("a[aria-label]").forEach((a) => {
      const visible = (a.textContent ?? "").replace(/\s+/g, " ").trim();
      const aria = (a.getAttribute("aria-label") ?? "").replace(/\s+/g, " ").trim();
      expect(aria.startsWith(visible)).toBe(true);
    });

    expect(
      screen.getByText(`${store.name} © 2026 - Acelerando com você.`),
    ).toBeInTheDocument();

    const uses = container.querySelectorAll('use[href="#icon-whatsapp"]');
    expect(uses).toHaveLength(2);
    container.querySelectorAll("svg").forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    expect(container.textContent).not.toMatch(/\bWhats\b/);
    expect(store.citation).not.toMatch(/99654-2733/);
  });
});
