import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LinksSection } from "./LinksSection";
import {
  googleMapsLink,
  googleReviewLink,
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
      screen.queryByRole("link", { name: /Grupo WhatsApp/i }),
    ).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("chat.whatsapp.com");
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
    expect(maps.getAttribute("href")).toContain("destination=-23.3883268");
    expect(maps.getAttribute("href")).toContain("-49.5062797");
    const review = screen.getByRole("link", {
      name: googleReviewLink.prominentLabel,
    });
    expect(review).toHaveAttribute("href", googleReviewLink.href);
    expect(review.getAttribute("href")).toContain("Bike+Center+Fartura");
    expect(review.getAttribute("href")).toContain("!9m1!1b1");
  });

  it("coloca a avaliação do Google antes do Pix e dos WhatsApps", () => {
    render(<LinksSection />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAccessibleName(googleReviewLink.prominentLabel);
    expect(links[0]).toHaveTextContent("Avalie no Google");
    expect(links[0].querySelector(".whitespace-nowrap")).toHaveTextContent(
      "Avalie no Google",
    );
    expect(links[0]).toHaveAttribute("href", googleReviewLink.href);
    expect(links[0].className).toMatch(/animate-pulse-review/);
    expect(links[0].className).toMatch(/motion-reduce:animate-none/);
    expect(
      screen.getByRole("link", { name: "Conversar no Whats (Claro)" }).className,
    ).not.toMatch(/animate-pulse/);
    const pix = screen.getByRole("button", { name: "Pagar com Pix" });
    const claro = screen.getByRole("link", {
      name: "Conversar no Whats (Claro)",
    });
    expect(
      links[0].compareDocumentPosition(pix) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      pix.compareDocumentPosition(claro) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("não renderiza oferta no topo quando o slot está vazio", () => {
    render(<LinksSection />);
    expect(screen.queryByRole("link", { name: /oferta/i })).not.toBeInTheDocument();
  });

  it("compacta as redes sociais em uma fileira com os destinos originais", () => {
    render(<LinksSection />);
    expect(
      screen.getByRole("link", { name: /Nosso Estoque no Instagram/ }),
    ).toHaveAttribute("href", "https://www.instagram.com/bikecenterfartura");
    expect(
      screen.getByRole("link", { name: /Acelere com a gente no TikTok/ }),
    ).toHaveAttribute("href", "https://www.tiktok.com/@bikecenterfartura");
    expect(
      screen.getByRole("link", { name: /Siga nossa Página/ }),
    ).toHaveAttribute(
      "href",
      "https://www.facebook.com/profile.php?id=61576748073943",
    );
  });
});
