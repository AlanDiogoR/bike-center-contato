import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewCarousel } from "./ReviewCarousel";
import { googleReviewLink } from "@/lib/links";

vi.mock("@/lib/track", () => ({
  trackOutboundClick: vi.fn(),
}));

describe("ReviewCarousel", () => {
  it("começa no site, no botão Avalie", () => {
    render(<ReviewCarousel />);
    expect(
      screen.getByRole("region", {
        name: "Passo a passo para avaliar no Google",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Passo 1 de 4")).toBeInTheDocument();
    expect(screen.getByText("Toque em Avalie")).toBeInTheDocument();
    expect(screen.queryByText("Abra o Instagram")).not.toBeInTheDocument();
    expect(screen.queryByText("Link da bio")).not.toBeInTheDocument();
    expect(
      screen.getByText("Avalie a Bike Center no Google"),
    ).toBeInTheDocument();
    expect(screen.getByText("Toque no botão")).toBeInTheDocument();
    expect(screen.getByText("Fartura/SP")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Avaliar agora no Google/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("review-cta-slot")).toHaveClass("h-12");
  });

  it("avança para a ficha no Maps", () => {
    render(<ReviewCarousel />);
    fireEvent.click(screen.getByRole("button", { name: "Próximo slide" }));
    expect(screen.getByText("Passo 2 de 4")).toBeInTheDocument();
    expect(screen.getByText("Abra a ficha no Maps")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Avaliar agora no Google/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("review-cta-slot")).toHaveClass("h-12");
  });

  it("percorre até publicar e oferece o link oficial de avaliações", () => {
    render(<ReviewCarousel />);
    fireEvent.click(
      screen.getByRole("tab", { name: /Ir para o passo 4: Publique/i }),
    );
    expect(screen.getByText("Passo 4 de 4")).toBeInTheDocument();
    expect(screen.getByText("Publicar")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Avaliar agora no Google/i });
    expect(cta).toHaveAttribute("href", googleReviewLink.href);
    expect(cta).toHaveClass("h-12");
    expect(screen.getByTestId("review-cta-slot")).toContainElement(cta);
  });
});
