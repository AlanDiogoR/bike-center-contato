"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  CONSENT_TEXT,
  CONSENT_TEXT_VERSION,
  VIP_OPT_OUT_HREF,
  VIP_STORAGE_KEY,
  downloadVcard,
  isValidVipInteresse,
  normalizeBrWhatsapp,
  readVipUtms,
  type VipInteresse,
} from "@/lib/vip";

export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  size?: "flexible" | "normal" | "compact";
  language?: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface TurnstileGlobal {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ) => string | undefined;
  reset: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

function checkLocalVipFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(VIP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function VipForm() {
  const nomeId = useId();
  const whatsappId = useId();
  const interesseId = useId();
  const consentId = useId();
  const empresaId = useId();
  const errorId = useId();
  const robotHintId = useId();

  const [alreadyRegistered] = useState<boolean>(() => checkLocalVipFlag());
  const [submitted, setSubmitted] = useState(false);

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [interesse, setInteresse] = useState<VipInteresse>("ambos");
  const [consent, setConsent] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const formRef = useRef<HTMLFormElement | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetRenderedRef = useRef(false);
  const widgetIdRef = useRef<string | undefined>(undefined);

  const renderTurnstileWidget = useCallback(() => {
    if (widgetRenderedRef.current) return;
    if (typeof window === "undefined" || !window.turnstile?.render) return;
    const container = turnstileContainerRef.current;
    if (!container) return;

    widgetRenderedRef.current = true;
    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
      size: "flexible",
      language: "pt-br",
      callback: (token: string) => {
        setTurnstileToken(token);
      },
      "expired-callback": () => {
        setTurnstileToken("");
      },
      "error-callback": () => {
        setTurnstileToken("");
      },
    });
  }, []);

  const activateTurnstile = useCallback(() => {
    if (typeof document === "undefined") return;
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (!script) {
      script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => {
        renderTurnstileWidget();
      });
      document.head.appendChild(script);
    }
    renderTurnstileWidget();
  }, [renderTurnstileWidget]);

  useEffect(() => {
    if (alreadyRegistered || submitted) return;
    const formEl = formRef.current;
    if (!formEl) return;

    const handleFocusIn = () => {
      activateTurnstile();
    };
    formEl.addEventListener("focusin", handleFocusIn);

    // O form só monta depois do clique no botão VIP. Após o primeiro paint,
    // carrega o Turnstile se o form já estiver no viewport (ou se não houver
    // IntersectionObserver); caso contrário, observa até ficar visível.
    let observer: IntersectionObserver | null = null;
    const isInViewport = () => {
      const rect = formEl.getBoundingClientRect();
      const vh =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const vw = window.innerWidth || document.documentElement.clientWidth || 0;
      return (
        rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw
      );
    };
    const checkVisibility = () => {
      if (typeof IntersectionObserver === "undefined" || isInViewport()) {
        activateTurnstile();
        return;
      }
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          activateTurnstile();
          observer?.disconnect();
        }
      });
      observer.observe(formEl);
    };
    const rafId =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(checkVisibility)
        : null;
    const timeoutId = rafId === null ? window.setTimeout(checkVisibility, 0) : null;

    return () => {
      formEl.removeEventListener("focusin", handleFocusIn);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [alreadyRegistered, submitted, activateTurnstile]);

  function resetTurnstile() {
    setTurnstileToken("");
    if (typeof window !== "undefined" && window.turnstile?.reset) {
      if (widgetIdRef.current !== undefined) {
        window.turnstile.reset(widgetIdRef.current);
      } else {
        window.turnstile.reset();
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");

    const domEmpresa =
      (
        event.currentTarget.elements.namedItem(
          "empresa",
        ) as HTMLInputElement | null
      )?.value ?? "";
    if (empresa.trim().length > 0 || domEmpresa.trim().length > 0) {
      return;
    }

    if (!consent) {
      setErrorMsg("Marque o consentimento LGPD para entrar na lista VIP.");
      return;
    }

    if (!turnstileToken) {
      activateTurnstile();
      return;
    }

    const trimmedNome = nome.trim();
    if (trimmedNome.length < 1 || trimmedNome.length > 80) {
      setErrorMsg("Informe seu nome (1 a 80 caracteres).");
      return;
    }

    const normalizedWhatsapp = normalizeBrWhatsapp(whatsapp);
    if (!normalizedWhatsapp) {
      setErrorMsg("Informe um WhatsApp válido com DDD.");
      return;
    }

    if (!isValidVipInteresse(interesse)) {
      setErrorMsg("Selecione uma opção de interesse válida.");
      return;
    }

    const utms =
      typeof window !== "undefined"
        ? readVipUtms(window.location.search)
        : { utm_source: null, utm_campaign: null };

    setSubmitting(true);
    try {
      const response = await fetch("/api/vip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: trimmedNome,
          whatsapp: normalizedWhatsapp,
          interesse,
          consent: true,
          consent_text_version: CONSENT_TEXT_VERSION,
          turnstile_token: turnstileToken,
          utm_source: utms.utm_source,
          utm_campaign: utms.utm_campaign,
          empresa: "",
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
      } | null;

      if (!response.ok || data?.ok !== true) {
        resetTurnstile();
        setErrorMsg(
          "Não foi possível concluir o cadastro agora. Tente novamente.",
        );
        return;
      }

      try {
        window.localStorage.setItem(VIP_STORAGE_KEY, "1");
      } catch {
        // Ignora bloqueio de storage no navegador
      }
      setSubmitted(true);
    } catch {
      resetTurnstile();
      setErrorMsg(
        "Não foi possível concluir o cadastro agora. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (alreadyRegistered || submitted) {
    return (
      <div className="mt-3 rounded-2xl border border-[#ead7b8] bg-white p-5 text-ink">
        <p
          role="status"
          aria-live="polite"
          className="text-base font-bold text-pine"
        >
          {submitted
            ? "Pronto! Você está na lista VIP."
            : "Você já está na lista VIP"}
        </p>
        <p className="mt-2 text-sm leading-snug text-ink">
          Salve o contato da Bike Center para receber a lista de transmissão
        </p>
        <button
          type="button"
          onClick={downloadVcard}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-pine px-4 py-3 text-base font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Salvar contato da Bike Center
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="relative mt-3 space-y-4 rounded-2xl border border-[#ead7b8] bg-white p-5 text-ink"
    >
      <div>
        <label
          htmlFor={nomeId}
          className="block text-sm font-semibold text-ink"
        >
          Nome
        </label>
        <input
          id={nomeId}
          name="nome"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border border-[#ead7b8] bg-paper px-3 text-base text-ink outline-none focus:border-sunset"
        />
      </div>

      <div>
        <label
          htmlFor={whatsappId}
          className="block text-sm font-semibold text-ink"
        >
          WhatsApp
        </label>
        <input
          id={whatsappId}
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required
          placeholder="(14) 99999-9999"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border border-[#ead7b8] bg-paper px-3 text-base text-ink outline-none focus:border-sunset"
        />
      </div>

      <div>
        <label
          htmlFor={interesseId}
          className="block text-sm font-semibold text-ink"
        >
          Interesse
        </label>
        <select
          id={interesseId}
          name="interesse"
          value={interesse}
          onChange={(e) => setInteresse(e.target.value as VipInteresse)}
          className="mt-1.5 h-12 w-full rounded-xl border border-[#ead7b8] bg-paper px-3 text-base text-ink outline-none focus:border-sunset"
        >
          <option value="moto">Moto</option>
          <option value="bike">Bike</option>
          <option value="ambos">Ambos</option>
        </select>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor={empresaId} aria-hidden="true">
          Empresa
        </label>
        <input
          id={empresaId}
          name="empresa"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start gap-2.5">
          <input
            id={consentId}
            name="consent"
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setErrorMsg("");
            }}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[#ead7b8] text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
          <label htmlFor={consentId} className="text-xs leading-snug text-ink">
            {CONSENT_TEXT}
          </label>
        </div>
        {!consent ? (
          <p className="text-xs font-medium text-[#9a3412]">
            Marque o consentimento acima para liberar o envio.
          </p>
        ) : null}
      </div>

      <div
        ref={turnstileContainerRef}
        data-testid="turnstile-container"
        className="min-h-[65px] w-full"
      />

      {errorMsg ? (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-semibold text-[#9a3412]"
        >
          {errorMsg}
        </p>
      ) : null}

      {!turnstileToken ? (
        <p
          id={robotHintId}
          aria-live="polite"
          className="text-xs font-medium text-muted"
        >
          Verificando que você não é um robô…
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!consent || submitting || !turnstileToken}
        aria-describedby={!turnstileToken ? robotHintId : undefined}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-pine px-4 py-3 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {submitting ? "Enviando…" : "Entrar na lista VIP"}
      </button>

      <div className="text-center">
        <a
          href={VIP_OPT_OUT_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-semibold text-muted underline"
        >
          Sair da lista
        </a>
      </div>
    </form>
  );
}

export default VipForm;
