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
    expect(screen.getByText("Avalie no Google")).toBeInTheDocument();
    expect(
      screen.getByText("No site, toque no botão “Avalie no Google”."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Avalie a Bike Center no Google|Nos avalie no Google/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Toque no botão")).toBeInTheDocument();
    expect(screen.getByText("Oficina, peças e acessórios")).toBeInTheDocument();
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
    expect(
      screen.getByText("Conte como foi sua experiência"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/5 de 5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/5 estrelas/i)).not.toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Avaliar agora no Google/i });
    expect(cta).toHaveAttribute("href", googleReviewLink.href);
    expect(cta).toHaveClass("h-12");
    expect(screen.getByTestId("review-cta-slot")).toContainElement(cta);
  });

  it("usa texto neutro e não induz nota em nenhum passo do carrossel", () => {
    render(<ReviewCarousel />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);

    for (const tab of tabs) {
      fireEvent.click(tab);
      expect(screen.queryByText(/5 estrelas/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cinco estrelas/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/5 de 5/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/nota máxima/i)).not.toBeInTheDocument();
    }

    fireEvent.click(
      screen.getByRole("tab", {
        name: /Ir para o passo 3: Escreva a avaliação/i,
      }),
    );
    expect(
      screen.getByText(
        "Toque em “Escrever uma avaliação” e conte como foi sua experiência.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("tab", { name: /Ir para o passo 4: Publique/i }),
    );
    expect(
      screen.getByText("Conte como foi sua experiência"),
    ).toBeInTheDocument();
  });
});
