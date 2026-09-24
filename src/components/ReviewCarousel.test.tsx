import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewCarousel } from "./ReviewCarousel";
import { googleReviewLink } from "@/lib/links";

vi.mock("@/lib/track", () => ({
  trackOutboundClick: vi.fn(),
}));

describe("ReviewCarousel", () => {
  it("começa no print do Instagram acessando o link da bio", () => {
    render(<ReviewCarousel />);
    expect(
      screen.getByRole("region", {
        name: "Passo a passo para avaliar no Google",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Passo 1 de 5")).toBeInTheDocument();
    expect(screen.getByText("Abra o Instagram")).toBeInTheDocument();
    expect(screen.getByText("Link da bio")).toBeInTheDocument();
    expect(screen.getByText("Toque no link")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Avaliar agora no Google/i }),
    ).not.toBeInTheDocument();
  });

  it("avança para o print do site no botão Avalie", () => {
    render(<ReviewCarousel />);
    fireEvent.click(screen.getByRole("button", { name: "Próximo slide" }));
    expect(screen.getByText("Passo 2 de 5")).toBeInTheDocument();
    expect(screen.getByText("Toque em Avalie")).toBeInTheDocument();
    expect(screen.getByText("Nos avalie no Google")).toBeInTheDocument();
    expect(screen.getByText("Toque no botão")).toBeInTheDocument();
  });

  it("percorre até publicar e oferece o link oficial de avaliações", () => {
    render(<ReviewCarousel />);
    fireEvent.click(
      screen.getByRole("tab", { name: /Ir para o passo 5: Publique/i }),
    );
    expect(screen.getByText("Passo 5 de 5")).toBeInTheDocument();
    expect(screen.getByText("Publicar")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Avaliar agora no Google/i });
    expect(cta).toHaveAttribute("href", googleReviewLink.href);
  });
});
