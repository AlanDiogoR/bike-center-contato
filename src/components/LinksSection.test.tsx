import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
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

vi.mock("next/image", () => ({
  default: ({
    alt,
    priority: _p,
    ...props
  }: {
    alt: string;
    src: string;
    width?: number;
    height?: number;
    className?: string;
    sizes?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const PLACA_CTA = "Avaliar no Google";
const DEFAULT_REVIEW_ARIA = `Avalie no Google — ${store.name}`;
const INCENTIVE =
  /brinde|pr[eê]mio|vip|cupom|desconto|sorteio|ganhe|oferta/i;

function installPlacaCss() {
  const style = document.createElement("style");
  style.textContent = `
    html:not([data-utm-source="placa"]) [data-placa="show"] { display: none; }
    html[data-utm-source="placa"] [data-placa="hide"] { display: none; }
  `;
  document.head.appendChild(style);
  return style;
}

describe("LinksSection", () => {
  let style: HTMLStyleElement;

  beforeEach(() => {
    style = installPlacaCss();
    document.documentElement.removeAttribute("data-utm-source");
  });

  afterEach(() => {
    style.remove();
    document.documentElement.removeAttribute("data-utm-source");
  });
  it("mantém os rótulos Claro/Vivo com WhatsApp por extenso e preserva os hrefs", () => {
    const { container } = render(<LinksSection />);
    const claro = screen.getByRole("link", {
      name: "Conversar no WhatsApp (Claro)",
    });
    const vivo = screen.getByRole("link", {
      name: "Conversar no WhatsApp (Vivo)",
    });
    expect(claro).toHaveAttribute("href", whatsappSalesLinks[0].href);
    expect(vivo).toHaveAttribute("href", whatsappSalesLinks[1].href);
    expect(claro).toHaveAttribute("aria-label", "Conversar no WhatsApp (Claro)");
    expect(vivo).toHaveAttribute("aria-label", "Conversar no WhatsApp (Vivo)");
    expect(claro.querySelector(".whitespace-nowrap")).toHaveTextContent(
      "(Claro)",
    );
    expect(vivo.querySelector(".whitespace-nowrap")).toHaveTextContent(
      "(Vivo)",
    );
    expect(container.textContent).not.toMatch(/\bWhats\b/);
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
      name: DEFAULT_REVIEW_ARIA,
    });
    expect(review).toHaveAttribute("href", googleReviewLink.href);
    expect(review.getAttribute("href")).toContain("Bike+Center+Fartura");
    expect(review.getAttribute("href")).toContain("!9m1!1b1");
  });

  it("coloca a avaliação do Google antes do Pix e dos WhatsApps", () => {
    render(<LinksSection />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAccessibleName(DEFAULT_REVIEW_ARIA);
    expect(links[0]).toHaveTextContent("Avalie no Google");
    expect(links[0].querySelector(".whitespace-nowrap")).toHaveTextContent(
      "Avalie no Google",
    );
    expect(links[0]).toHaveAttribute("href", googleReviewLink.href);
    expect(links[0].className).toMatch(/animate-pulse-review/);
    expect(links[0].className).toMatch(/motion-reduce:animate-none/);
    expect(
      screen.getByRole("link", { name: "Conversar no WhatsApp (Claro)" }).className,
    ).not.toMatch(/animate-pulse/);
    const pix = screen.getByRole("button", { name: "Pagar com Pix" });
    const claro = screen.getByRole("link", {
      name: "Conversar no WhatsApp (Claro)",
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

  it("sem utm_source=placa mantém o botão e o tutorial de hoje", () => {
    render(<LinksSection />);
    const review = screen.getByRole("link", {
      name: DEFAULT_REVIEW_ARIA,
    });
    expect(review).toBeVisible();
    expect(review).toHaveAttribute("href", googleReviewLink.href);
    expect(review.className).toMatch(/animate-pulse-review/);
    expect(review.className).toMatch(/motion-reduce:animate-none/);
    expect(
      screen.queryByRole("link", { name: PLACA_CTA }),
    ).not.toBeInTheDocument();
    const parked = document.querySelector('a[data-placa="show"]');
    expect(parked).not.toBeVisible();
    expect(parked).toHaveAttribute("href", googleReviewLink.href);
    expect(parked).toHaveTextContent(PLACA_CTA);
    expect(review).toHaveTextContent("Avalie no Google");
    expect(screen.getByText("Como nos avaliar")).toBeVisible();
    expect(screen.getByText("Passo 1 de 4")).toBeVisible();
    expect(screen.getByText("Toque em Avalie")).toBeVisible();
    expect(screen.queryByText("Abra o Instagram")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: "Passo a passo para avaliar no Google",
      }),
    ).toBeVisible();
  });

  it("com utm_source=placa esconde o tutorial e mostra o CTA grande", () => {
    document.documentElement.setAttribute("data-utm-source", "placa");
    render(<LinksSection />);

    const links = screen.getAllByRole("link");
    const cta = screen.getByRole("link", { name: PLACA_CTA });
    expect(links[0]).toBe(cta);
    expect(cta).toBeVisible();
    expect(cta).toHaveAttribute("href", googleReviewLink.href);
    expect(cta.getAttribute("href")).toBe(googleReviewLink.href);
    expect(cta.getAttribute("href")).not.toMatch(/[?&](stars|rating)=/i);
    expect(cta.className).toMatch(/animate-pulse-review/);
    expect(cta.className).toMatch(/motion-reduce:animate-none/);
    expect(cta.className).toMatch(/min-h-24/);
    expect(cta.className).toMatch(/text-2xl/);
    expect(cta.textContent ?? "").not.toMatch(INCENTIVE);

    expect(
      screen.queryByRole("link", { name: DEFAULT_REVIEW_ARIA }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Como nos avaliar")).not.toBeVisible();
    expect(screen.getByText("Passo 1 de 4")).not.toBeVisible();
    expect(screen.getByText("Toque em Avalie")).not.toBeVisible();
    expect(
      screen.queryByRole("region", {
        name: "Passo a passo para avaliar no Google",
      }),
    ).not.toBeInTheDocument();

    const original = document.querySelector('a[data-placa="hide"]');
    expect(original).not.toBeVisible();
    expect(original).toHaveTextContent("Avalie no Google");
    expect(original).toHaveAttribute(
      "aria-label",
      DEFAULT_REVIEW_ARIA,
    );
    expect(original).toHaveAttribute("href", cta.getAttribute("href"));
    expect(
      screen.getByRole("link", { name: "Conversar no WhatsApp (Claro)" }),
    ).toBeVisible();
  });

  it("usa o símbolo único #icon-whatsapp (3 <use> no corpo + 2 no rodapé = 5) e o SVG oficial do Mercado Livre sem SiMercadopago", () => {
    const { container } = render(<HomePage />);

    const symbols = container.querySelectorAll("symbol#icon-whatsapp");
    expect(symbols.length).toBe(1);
    expect(symbols[0].getAttribute("viewBox")).toBe("0 0 720 720");

    const allUses = container.querySelectorAll('use[href="#icon-whatsapp"]');
    expect(allUses.length).toBe(5);

    const footer = container.querySelector("footer");
    expect(Boolean(footer)).toBe(true);
    const footerUses = footer!.querySelectorAll('use[href="#icon-whatsapp"]');
    expect(footerUses.length).toBe(2);
    expect(allUses.length - footerUses.length).toBe(3);

    const svgs = Array.from(container.querySelectorAll("svg"));
    expect(container.innerHTML).not.toContain("#3483FA");
    expect(
      svgs.filter((s) => s.getAttribute("viewBox") === "0 0 163 113").length,
    ).toBe(2);

    const waLinks = container.querySelectorAll('a[href^="https://wa.me/"]');
    expect(waLinks.length).toBe(4);
    waLinks.forEach((a) => {
      const aria = a.getAttribute("aria-label") ?? "";
      expect(aria).toContain("WhatsApp");
      expect(aria).not.toMatch(/\bWhats\b/);
      const svg = a.querySelector("svg");
      expect(svg?.getAttribute("viewBox")).toBe("0 0 720 720");
      expect(Boolean(a.querySelector('use[href="#icon-whatsapp"]'))).toBe(true);
    });

    container.querySelectorAll("a[aria-label]").forEach((a) => {
      const visible = (a.textContent ?? "").replace(/\s+/g, " ").trim();
      const aria = (a.getAttribute("aria-label") ?? "").replace(/\s+/g, " ").trim();
      expect(aria.startsWith(visible)).toBe(true);
    });

    container.querySelectorAll('a[href*="google.com/maps"]').forEach((a) => {
      expect(a.getAttribute("href")).not.toContain("/maps/place//");
      expect(a.getAttribute("href")).not.toContain("/place//");
    });

    expect(container.textContent).not.toMatch(/\bWhats\b/);
  });
});
