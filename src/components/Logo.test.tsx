import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Logo } from "./Logo";
import { store } from "@/lib/links";

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

describe("Logo", () => {
  it("renderiza o nome da loja no texto alternativo", () => {
    render(<Logo />);
    expect(
      screen.getByAltText(/Bike Center Fartura/i),
    ).toBeInTheDocument();
  });

  it("usa logo.png transparente", () => {
    render(<Logo />);
    const img = screen.getByAltText(/Bike Center Fartura/i);
    expect(img).toHaveAttribute("src", "/logo.png");
    expect(img.parentElement).toHaveClass("ring-[#9a3412]");
    expect(img.parentElement?.className).not.toContain("ring-sun");
  });

  it("mostra a tagline e a linha de confiança como texto simples (sem link)", () => {
    const { container } = render(<Logo />);
    expect(screen.getByText(store.tagline)).toBeInTheDocument();
    const trust = screen.getByText(store.trustLine);
    expect(trust.tagName).toBe("P");
    expect(trust.closest("a")).toBeNull();
    expect(
      screen.queryByRole("link", { name: store.trustLine }),
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("tem exatamente um H1 visível com o nome da loja", () => {
    render(<Logo />);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(
      "Bike Center Fartura — motos e bicicletas em Fartura/SP",
    );
  });
});
