import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Logo } from "./Logo";

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
  });
});
