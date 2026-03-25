import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renderiza o nome da loja no texto alternativo", () => {
    render(<Logo />);
    expect(
      screen.getByAltText(/Bike Center Fartura/i),
    ).toBeInTheDocument();
  });
});
