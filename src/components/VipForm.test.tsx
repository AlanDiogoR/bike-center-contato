import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PHONE_CLARO } from "@/lib/links";
import {
  CONSENT_TEXT,
  CONSENT_TEXT_VERSION,
  VIP_STORAGE_KEY,
} from "@/lib/vip";
import { LinksSection } from "./LinksSection";
import { VipEntry } from "./VipEntry";
import { TURNSTILE_SCRIPT_SRC, VipForm } from "./VipForm";

const CF_TEST_SITE_KEY = "1x00000000000000000000AA";

describe("VipForm e VipEntry", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    document
      .querySelectorAll(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)
      .forEach((s) => s.remove());
    delete window.turnstile;
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("1. Flag off: LinksSection não renderiza o botão VIP quando a flag está desligada", () => {
    render(<LinksSection />);
    expect(
      screen.queryByRole("button", { name: /Quero ofertas VIP no WhatsApp/i }),
    ).not.toBeInTheDocument();
  });

  it("VipEntry mantém data-placa='hide' e só carrega o formulário após o clique", async () => {
    const { container } = render(<VipEntry />);
    const wrapper = container.querySelector('[data-placa="hide"]');
    expect(wrapper).toBeInTheDocument();

    const trigger = screen.getByRole("button", {
      name: "Quero ofertas VIP no WhatsApp",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    expect(await screen.findByLabelText("Nome")).toBeInTheDocument();
  });

  it("Turnstile lazy: não injeta o script antes de foco ou visibilidade e injeta apenas uma vez ao focar", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = CF_TEST_SITE_KEY;
    const renderMock = vi.fn(() => "widget-test-1");
    const resetMock = vi.fn();
    window.turnstile = {
      render: renderMock,
      reset: resetMock,
    };

    render(<VipForm />);

    // Antes de focusin ou IntersectionObserver: script NÃO existe no DOM
    expect(
      document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`),
    ).toBeNull();
    expect(renderMock).not.toHaveBeenCalled();

    const nomeInput = screen.getByLabelText("Nome");
    fireEvent.focusIn(nomeInput);

    const scripts = document.querySelectorAll(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    expect(scripts).toHaveLength(1);
    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(renderMock).toHaveBeenCalledWith(
      screen.getByTestId("turnstile-container"),
      expect.objectContaining({
        sitekey: CF_TEST_SITE_KEY,
        size: "flexible",
        language: "pt-br",
      }),
    );

    // Segundo focusin não duplica script nem re-renderiza o widget
    fireEvent.focusIn(screen.getByLabelText("WhatsApp"));
    expect(
      document.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_SRC}"]`),
    ).toHaveLength(1);
    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  it("2. Honeypot no componente: campo empresa preenchido não chama /api/vip", () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const { container } = render(<VipForm />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "João Bot" },
    });
    fireEvent.change(screen.getByLabelText("WhatsApp"), {
      target: { value: "(14) 99166-7793" },
    });
    fireEvent.click(screen.getByLabelText(CONSENT_TEXT));

    const honeypot = container.querySelector(
      'input[name="empresa"]',
    ) as HTMLInputElement;
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot).toHaveAttribute("aria-hidden", "true");

    fireEvent.change(honeypot, { target: { value: "Empresa Spam" } });
    fireEvent.click(
      screen.getByRole("button", { name: /Entrar na lista VIP/i }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("3 e 5. Checkbox LGPD começa desmarcado e bloqueia o envio; ao marcar e enviar com sucesso, mostra aria-live, botão .vcf, grava vip_cadastrado='1' sem PII e oculta o form ao recarregar", async () => {
    window.history.pushState(
      {},
      "",
      "/?utm_source=instagram&utm_campaign=vip_novembro",
    );

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    window.turnstile = {
      render: vi.fn((_el, opts) => {
        opts.callback?.("token-turnstile-123");
        return "w1";
      }),
      reset: vi.fn(),
    };

    const { unmount } = render(<VipForm />);

    const checkbox = screen.getByLabelText(CONSENT_TEXT) as HTMLInputElement;
    const submitBtn = screen.getByRole("button", {
      name: /Entrar na lista VIP/i,
    });
    const optOutLink = screen.getByRole("link", { name: "Sair da lista" });

    expect(checkbox.checked).toBe(false);
    expect(submitBtn).toBeDisabled();
    expect(
      screen.getByText(/Marque o consentimento acima para liberar o envio/i),
    ).toBeInTheDocument();
    expect(optOutLink).toHaveAttribute(
      "href",
      `https://wa.me/${PHONE_CLARO}?text=SAIR`,
    );

    // Tentativa de submit forçado com checkbox desmarcado não chama fetch
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });
    fireEvent.change(screen.getByLabelText("WhatsApp"), {
      target: { value: "(14) 99166-7793" },
    });
    fireEvent.change(screen.getByLabelText("Interesse"), {
      target: { value: "bike" },
    });
    fireEvent.submit(submitBtn.closest("form")!);
    expect(fetchMock).not.toHaveBeenCalled();

    // Foca para carregar Turnstile e marca o consentimento LGPD
    fireEvent.focusIn(screen.getByLabelText("Nome"));
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(calledUrl).toBe("/api/vip");
    expect(calledInit.method).toBe("POST");
    expect(JSON.parse(String(calledInit.body))).toEqual({
      nome: "Ana Paula",
      whatsapp: "+5514991667793",
      interesse: "bike",
      consent: true,
      consent_text_version: CONSENT_TEXT_VERSION,
      turnstile_token: "token-turnstile-123",
      utm_source: "instagram",
      utm_campaign: "vip_novembro",
      empresa: "",
    });

    // Mensagem de sucesso em aria-live="polite" e botão do vCard
    const statusMsg = await screen.findByText(
      "Pronto! Você está na lista VIP.",
    );
    expect(statusMsg).toHaveAttribute("aria-live", "polite");
    expect(
      screen.getByText(
        "Salve o contato da Bike Center para receber a lista de transmissão",
      ),
    ).toBeInTheDocument();
    const vcfBtn = screen.getByRole("button", {
      name: "Salvar contato da Bike Center",
    });
    expect(vcfBtn).toBeInTheDocument();

    // Verifica que localStorage guardou apenas "1" (sem PII)
    expect(window.localStorage.getItem(VIP_STORAGE_KEY)).toBe("1");
    const storageDump = JSON.stringify(window.localStorage);
    expect(storageDump).not.toContain("Ana Paula");
    expect(storageDump).not.toContain("991667793");

    // Recarregar o componente com a flag local mostra apenas "Você já está na lista VIP" e o botão do .vcf, sem o form
    unmount();
    render(<VipForm />);
    expect(
      screen.getByText("Você já está na lista VIP"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salvar contato da Bike Center" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("reseta o Turnstile quando a API retorna erro", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ ok: false, error: "captcha" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const resetMock = vi.fn();
    window.turnstile = {
      render: vi.fn((_el, opts) => {
        opts.callback?.("tok-bad");
        return "widget-err";
      }),
      reset: resetMock,
    };

    render(<VipForm />);
    fireEvent.focusIn(screen.getByLabelText("Nome"));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Pedro" },
    });
    fireEvent.change(screen.getByLabelText("WhatsApp"), {
      target: { value: "(14) 99166-7793" },
    });
    fireEvent.click(screen.getByLabelText(CONSENT_TEXT));
    fireEvent.click(
      screen.getByRole("button", { name: /Entrar na lista VIP/i }),
    );

    await waitFor(() => {
      expect(resetMock).toHaveBeenCalledWith("widget-err");
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
