import { readFileSync } from "fs";
import { fireEvent, render, screen } from "@testing-library/react";
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

function getVisibleFlexItemsInOrder() {
  const list = document.querySelector(".flex.flex-col.gap-3");
  if (!list) return [];
  return Array.from(list.children)
    .filter((el) => window.getComputedStyle(el).display !== "none")
    .sort((a, b) => {
      const orderA = Number(window.getComputedStyle(a).order || 0);
      const orderB = Number(window.getComputedStyle(b).order || 0);
      return orderA - orderB;
    });
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

  it("coloca o WhatsApp como 1º CTA visível na home padrão e a avaliação secundária sem pulso depois dos WhatsApps", () => {
    render(<LinksSection />);
    const links = screen.getAllByRole("link");
    const claro = screen.getByRole("link", {
      name: "Conversar no WhatsApp (Claro)",
    });
    const vivo = screen.getByRole("link", {
      name: "Conversar no WhatsApp (Vivo)",
    });
    const pix = screen.getByRole("button", { name: "Pagar com Pix" });
    const review = screen.getByRole("link", {
      name: DEFAULT_REVIEW_ARIA,
    });

    expect(links[0]).toBe(claro);
    expect(links[1]).toBe(vivo);
    expect(links[2]).toBe(review);

    const ordered = getVisibleFlexItemsInOrder();
    expect(ordered[0]).toBe(claro);
    expect(ordered[1]).toBe(vivo);
    expect(ordered[2]).toBe(pix);
    expect(ordered[3]).toBe(review);
    expect(window.getComputedStyle(claro).order).not.toBe("-1");
    expect(window.getComputedStyle(vivo).order).not.toBe("-1");

    expect(
      claro.compareDocumentPosition(vivo) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      vivo.compareDocumentPosition(pix) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      pix.compareDocumentPosition(review) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(review).toHaveAccessibleName(DEFAULT_REVIEW_ARIA);
    expect(review).toHaveTextContent("Avalie no Google");
    expect(review.querySelector(".whitespace-nowrap")).toHaveTextContent(
      "Avalie no Google",
    );
    expect(review).toHaveAttribute("href", googleReviewLink.href);
    expect(review.className).not.toMatch(/animate-pulse-review/);
    expect(review.className).not.toMatch(/animate-pulse/);
    expect(review.className).toMatch(/min-h-14/);
    expect(review.className).toMatch(/text-base/);
    expect(claro.className).not.toMatch(/animate-pulse/);

    expect(
      claro.compareDocumentPosition(review) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      vivo.compareDocumentPosition(review) & Node.DOCUMENT_POSITION_FOLLOWING,
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

  it("sem utm_source=placa mantém o botão de avaliação visível (sem pulso) e o tutorial", () => {
    render(<LinksSection />);
    const review = screen.getByRole("link", {
      name: DEFAULT_REVIEW_ARIA,
    });
    expect(review).toBeVisible();
    expect(review).toHaveAttribute("href", googleReviewLink.href);
    expect(review.className).not.toMatch(/animate-pulse-review/);
    expect(review.className).toMatch(/min-h-14/);
    expect(review.className).toMatch(/text-base/);
    expect(
      screen.queryByRole("link", { name: PLACA_CTA }),
    ).not.toBeInTheDocument();
    const parked = document.querySelector('a[data-placa="show"]');
    expect(parked).not.toBeVisible();
    expect(parked).toHaveAttribute("href", googleReviewLink.href);
    expect(parked).toHaveTextContent(PLACA_CTA);
    expect(parked?.className).toMatch(/animate-pulse-review/);
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

  it("com utm_source=placa esconde o tutorial e mostra o CTA grande na mesma ordem de antes", () => {
    document.documentElement.setAttribute("data-utm-source", "placa");
    render(<LinksSection />);

    const links = screen.getAllByRole("link");
    const cta = screen.getByRole("link", { name: PLACA_CTA });
    const pix = screen.getByRole("button", { name: "Pagar com Pix" });
    const claro = screen.getByRole("link", {
      name: "Conversar no WhatsApp (Claro)",
    });
    const vivo = screen.getByRole("link", {
      name: "Conversar no WhatsApp (Vivo)",
    });

    expect(links[0]).toBe(cta);
    expect(links[1]).toBe(claro);
    expect(links[2]).toBe(vivo);

    const ordered = getVisibleFlexItemsInOrder();
    expect(ordered[0]).toBe(cta);
    expect(ordered[1]).toBe(pix);
    expect(ordered[2]).toBe(claro);
    expect(ordered[3]).toBe(vivo);
    expect(window.getComputedStyle(claro).order).not.toBe("-1");
    expect(window.getComputedStyle(pix).order).not.toBe("-1");
    expect(
      cta.compareDocumentPosition(pix) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      pix.compareDocumentPosition(claro) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      claro.compareDocumentPosition(vivo) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

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
    expect(original?.className).not.toMatch(/animate-pulse-review/);
    expect(original).toHaveAttribute(
      "aria-label",
      DEFAULT_REVIEW_ARIA,
    );
    expect(original).toHaveAttribute("href", cta.getAttribute("href"));
    expect(claro).toBeVisible();
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

  it("garante que globals.css não contém order: -1 para .cta-wa", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).not.toContain("order: -1");
    expect(css).not.toMatch(/\.cta-wa\s*\{[^}]*order/);
  });

  it("permite abrir o modal do Pix em ambas as variantes", () => {
    // 1) Home padrão
    const { unmount } = render(<LinksSection />);
    const pixDefault = screen.getByRole("button", { name: "Pagar com Pix" });
    expect(pixDefault).toBeVisible();
    expect(pixDefault).toHaveAttribute("data-placa", "hide");
    fireEvent.click(pixDefault);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    unmount();

    // 2) Variante placa
    document.documentElement.setAttribute("data-utm-source", "placa");
    render(<LinksSection />);
    const pixPlaca = screen.getByRole("button", { name: "Pagar com Pix" });
    expect(pixPlaca).toBeVisible();
    expect(pixPlaca).toHaveAttribute("data-placa", "show");
    fireEvent.click(pixPlaca);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
