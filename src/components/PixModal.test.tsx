import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LinksSection } from "./LinksSection";
import {
  PIX_BENEFICIARY_LABEL,
  PIX_HOW_TO_PAY,
  PIX_KEY_LABEL,
  buildPixPayload,
} from "@/lib/pix";

vi.mock("@/lib/track", () => ({
  trackOutboundClick: vi.fn(),
}));

function openPix() {
  render(<LinksSection />);
  const button = screen.getByRole("button", { name: "Pagar com Pix" });
  button.focus();
  fireEvent.click(button);
  return button;
}

describe("PixModal", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });

  it("abre um diálogo, mostra o beneficiário e gera o copia e cola sem valor", async () => {
    openPix();
    const dialog = await screen.findByRole("dialog", { name: "Pix copia e cola" });
    expect(dialog).toHaveFocus();
    expect(screen.getByText(PIX_BENEFICIARY_LABEL)).toBeInTheDocument();
    expect(screen.getByText(PIX_KEY_LABEL)).toBeInTheDocument();
    expect(screen.getByText(PIX_HOW_TO_PAY)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Pix copia e cola" })).toHaveValue(
      buildPixPayload(null),
    );
  });

  it("aplica a máscara e inclui R$ 10,00 no payload", async () => {
    openPix();
    const input = await screen.findByLabelText("Valor em reais (opcional)");
    fireEvent.change(input, { target: { value: "1000" } });
    expect(input).toHaveValue("10,00");
    expect(screen.getByRole("textbox", { name: "Pix copia e cola" })).toHaveValue(
      buildPixPayload("10.00"),
    );
  });

  it("bloqueia valor zero", async () => {
    openPix();
    const input = await screen.findByLabelText("Valor em reais (opcional)");
    fireEvent.change(input, { target: { value: "0" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/maior que zero/i);
    expect(
      screen.queryByRole("textbox", { name: "Pix copia e cola" }),
    ).not.toBeInTheDocument();
  });

  it("copia com feedback no aria-live", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    openPix();
    fireEvent.click(await screen.findByRole("button", { name: "Copiar" }));
    expect(writeText).toHaveBeenCalledWith(buildPixPayload(null));
    expect(await screen.findByText("Código Pix copiado")).toBeInTheDocument();
  });

  it("fecha com Esc e devolve o foco ao botão", async () => {
    const button = openPix();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(button).toHaveFocus();
  });

  it("compartilha o payload quando o navegador oferece navigator.share", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    openPix();
    fireEvent.click(await screen.findByRole("button", { name: "Compartilhar" }));
    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: "Pix Bike Center",
        text: buildPixPayload(null),
      });
    });
    expect(await screen.findByText("Código Pix compartilhado")).toBeInTheDocument();
  });

  it("prende o Tab dentro do diálogo", async () => {
    openPix();
    const dialog = await screen.findByRole("dialog");
    const items = Array.from(
      dialog.querySelectorAll<HTMLElement>("button, input, textarea"),
    );
    const first = items[0];
    const last = items[items.length - 1];
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });
});
