import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinksSection } from "./LinksSection";
import {
  googleMapsLink,
  store,
  whatsappSalesLinks,
} from "@/lib/links";

vi.mock("@/lib/track", () => ({
  trackOutboundClick: vi.fn(),
}));

describe("LinksSection", () => {
  it("mantém os rótulos Claro/Vivo e preserva os hrefs", () => {
    render(<LinksSection />);
    const claro = screen.getByRole("link", {
      name: "Conversar no Whats (Claro)",
    });
    const vivo = screen.getByRole("link", {
      name: "Conversar no Whats (Vivo)",
    });
    expect(claro).toHaveAttribute("href", whatsappSalesLinks[0].href);
    expect(vivo).toHaveAttribute("href", whatsappSalesLinks[1].href);
    expect(
      screen.queryByRole("link", { name: /Vendas e orçamento|Oficina e peças/i }),
    ).not.toBeInTheDocument();
  });

  it("mostra endereço e horário da loja sem depender do Maps", () => {
    render(<LinksSection />);
    expect(screen.getByText("Loja física")).toBeInTheDocument();
    expect(screen.getByText(store.address.display)).toBeInTheDocument();
    expect(screen.getByText(store.hours.display)).toBeInTheDocument();
    const maps = screen.getByRole("link", { name: googleMapsLink.label });
    expect(maps).toHaveAttribute("href", googleMapsLink.href);
  });

  it("não renderiza oferta no topo quando o slot está vazio", () => {
    render(<LinksSection />);
    expect(screen.queryByRole("link", { name: /oferta/i })).not.toBeInTheDocument();
  });

  it("compacta as redes sociais em uma fileira com os destinos originais", () => {
    render(<LinksSection />);
    expect(
      screen.getByRole("link", { name: "Nosso Estoque no Instagram" }),
    ).toHaveAttribute("href", "https://www.instagram.com/bikecenterfartura");
    expect(
      screen.getByRole("link", { name: "Acelere com a gente no TikTok" }),
    ).toHaveAttribute("href", "https://www.tiktok.com/@bikecenterfartura");
    expect(
      screen.getByRole("link", { name: "Siga nossa Página" }),
    ).toHaveAttribute(
      "href",
      "https://www.facebook.com/profile.php?id=61576748073943",
    );
  });
});
