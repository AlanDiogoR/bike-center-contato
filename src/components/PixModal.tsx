"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  PIX_BENEFICIARY_LABEL,
  PIX_HOW_TO_PAY,
  PIX_KEY_LABEL,
  buildPixPayload,
  parsePixAmountDigits,
} from "@/lib/pix";

type PixModalProps = {
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

function listFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

export function PixModal({ onClose, triggerRef }: PixModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const hintId = useId();
  const errorId = useId();
  const payloadId = useId();
  const amountId = useId();
  const [digits, setDigits] = useState("");
  const [status, setStatus] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const parsed = parsePixAmountDigits(digits);
  const payload = parsed.error ? null : buildPixPayload(parsed.amount);
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    dialog?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = listFocusable(dialog);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && dialog.contains(active);
      if (event.shiftKey) {
        if (!inside || active === first || active === dialog) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (!inside || active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [triggerRef]);

  useEffect(() => {
    if (!payload) {
      setQrDataUrl(null);
      setQrFailed(false);
      return;
    }
    let cancelled = false;
    setQrDataUrl(null);
    setQrFailed(false);
    import("qrcode")
      .then((mod) => {
        const toDataURL = mod.toDataURL ?? mod.default?.toDataURL;
        if (!toDataURL) throw new Error("qrcode sem toDataURL");
        return toDataURL(payload, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 240,
          color: { dark: "#18181b", light: "#ffffff" },
        });
      })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  async function copyPayload() {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setStatus("Código Pix copiado");
    } catch {
      setStatus("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  async function sharePayload() {
    if (!payload || !canShare) return;
    try {
      await navigator.share({
        title: "Pix Bike Center",
        text: payload,
      });
      setStatus("Código Pix compartilhado");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("Não foi possível compartilhar. Use o botão Copiar.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hintId}
        tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-700 bg-zinc-900 px-5 pb-6 pt-5 text-zinc-100 shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold leading-snug">
            Pix copia e cola
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-zinc-600 px-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Fechar
          </button>
        </div>

        <p className="mt-4 text-sm font-medium leading-snug">{PIX_BENEFICIARY_LABEL}</p>
        <p className="mt-1 text-sm font-medium leading-snug">{PIX_KEY_LABEL}</p>
        <p id={hintId} className="mt-3 text-sm leading-snug text-zinc-300">
          {PIX_HOW_TO_PAY}
        </p>

        <div className="mt-4">
          <label htmlFor={amountId} className="text-sm font-semibold">
            Valor em reais (opcional)
          </label>
          <div className="mt-1.5 flex min-h-11 items-center rounded-lg border border-zinc-600 bg-zinc-950 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#32BCAD]">
            <span className="pl-3 text-sm font-semibold text-zinc-300" aria-hidden>
              R$
            </span>
            <input
              id={amountId}
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              placeholder="0,00"
              aria-invalid={parsed.error ? true : undefined}
              aria-describedby={
                parsed.error ? `${hintId} ${errorId}` : hintId
              }
              value={parsed.display}
              onChange={(event) => {
                setDigits(event.target.value.replace(/\D/g, "").slice(0, 12));
                setStatus("");
              }}
              className="h-11 w-full bg-transparent px-2 text-base text-zinc-100 outline-none placeholder:text-zinc-400"
            />
          </div>
          <p className="mt-1 text-xs leading-snug text-zinc-300">
            Os dois últimos dígitos são os centavos. Ex.: 1000 = R$ 10,00. Em
            branco, o pagador informa o valor.
          </p>
          {parsed.error ? (
            <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-red-200">
              {parsed.error}
            </p>
          ) : null}
        </div>

        {payload ? (
          <>
            <div
              className="mx-auto mt-4 flex h-60 w-60 items-center justify-center rounded-lg bg-white"
              aria-busy={qrDataUrl ? undefined : true}
            >
              {qrDataUrl ? (
                // QR é data URL gerada no cliente; next/image não se aplica.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code Pix da Bike Center. O conteúdo é o mesmo código copia e cola."
                  width={240}
                  height={240}
                />
              ) : (
                <p className="px-4 text-center text-sm font-medium text-zinc-800">
                  {qrFailed
                    ? "Não foi possível gerar o QR. Use o copia e cola."
                    : "Gerando QR Code…"}
                </p>
              )}
            </div>

            <label htmlFor={payloadId} className="mt-4 block text-sm font-semibold">
              Pix copia e cola
            </label>
            <textarea
              id={payloadId}
              readOnly
              value={payload}
              rows={4}
              className="mt-1.5 w-full resize-none rounded-lg border border-zinc-600 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-100"
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={copyPayload}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#25D366] px-4 text-base font-bold text-zinc-950 hover:bg-[#3dde78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Copiar
              </button>
              {canShare ? (
                <button
                  type="button"
                  onClick={sharePayload}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-zinc-500 px-4 text-base font-semibold text-zinc-100 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Compartilhar
                </button>
              ) : null}
            </div>
            <p aria-live="polite" className="mt-2 min-h-5 text-sm font-semibold text-emerald-200">
              {status}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
