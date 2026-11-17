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
      name: `Ver ${store.name} no Google Maps. ${store.address.napDisplay}`,
    });
    expect(mapsLink).toHaveAttribute("href", googleMapsPlaceLink.href);
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
      name: "Conversar no WhatsApp (Claro) (14) 99166-7793",
    });
    expect(claro).toHaveAttribute("href", whatsappSalesLinks[0].href);
    expect(claro.className).toMatch(/min-h-11/);
    expect(within(claro).getByText("WhatsApp Claro")).toBeInTheDocument();
    expect(within(claro).getByText("(14) 99166-7793")).toBeInTheDocument();

    const vivo = screen.getByRole("link", {
      name: "Conversar no WhatsApp (Vivo) (14) 99632-5919",
    });
    expect(vivo).toHaveAttribute("href", whatsappSalesLinks[1].href);
    expect(vivo.className).toMatch(/min-h-11/);
    expect(within(vivo).getByText("WhatsApp Vivo")).toBeInTheDocument();
    expect(within(vivo).getByText("(14) 99632-5919")).toBeInTheDocument();

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
