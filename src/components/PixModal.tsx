"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  PIX_BENEFICIARY_LABEL,
  PIX_HOW_TO_PAY,
  PIX_KEY_LABEL,
  PIX_SHARE_LABEL,
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
  const stepsId = useId();
  const [digits, setDigits] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const parsed = parsePixAmountDigits(digits);
  const payload = parsed.error ? null : buildPixPayload(parsed.amount);

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
          color: { dark: "#171516", light: "#ffffff" },
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

  async function copyPayload(message = "Código Pix copiado") {
    if (!payload) return false;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setStatus(message);
      return true;
    } catch {
      setCopied(false);
      setStatus("Não foi possível copiar. Selecione o código manualmente.");
      return false;
    }
  }

  async function shareOrCopy() {
    if (!payload) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Pix Bike Center",
          text: payload,
        });
        setStatus("Lista do celular aberta. Escolha o app do banco e confira o nome.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyPayload(
      "Este aparelho não abre a lista de apps. Código Pix copiado para colar no banco.",
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/70" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hintId}
        tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-paper px-5 pb-6 pt-5 text-ink shadow-2xl outline-none sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-2xl uppercase leading-none tracking-wide">
            Pix copia e cola
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-[#ead7b8] bg-white px-3 text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Fechar
          </button>
        </div>

        <ol id={stepsId} className="mt-4 space-y-4">
          <li className="rounded-2xl bg-white p-4">
            <p className="font-display text-sm uppercase tracking-wide text-[#9a3412]">1. Confira</p>
            <p className="mt-1 text-base font-semibold leading-snug">{PIX_BENEFICIARY_LABEL}</p>
            <p className="mt-1 text-base leading-snug">{PIX_KEY_LABEL}</p>
          </li>

          <li className="rounded-2xl bg-white p-4">
            <label htmlFor={amountId} className="font-display text-sm uppercase tracking-wide text-[#9a3412]">
              2. Valor em reais (opcional)
            </label>
            <div className="mt-2 flex min-h-12 items-center rounded-xl border-2 border-[#ead7b8] bg-paper focus-within:border-sunset">
              <span className="pl-3 text-lg font-semibold text-muted" aria-hidden>
                R$
              </span>
              <input
                id={amountId}
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="done"
                placeholder="0,00"
                aria-invalid={parsed.error ? true : undefined}
                aria-describedby={parsed.error ? `${hintId} ${errorId}` : hintId}
                value={parsed.display}
                onChange={(event) => {
                  setDigits(event.target.value.replace(/\D/g, "").slice(0, 12));
                  setStatus("");
                  setCopied(false);
                }}
                className="h-12 w-full bg-transparent px-2 text-lg text-ink outline-none placeholder:text-[#6b5344]"
              />
            </div>
            <p className="mt-2 text-sm leading-snug text-muted">
              Os dois últimos dígitos são os centavos. Ex.: 1000 = R$ 10,00. Em branco, quem paga informa o valor.
            </p>
            {parsed.error ? (
              <p id={errorId} role="alert" className="mt-1 text-sm font-semibold text-[#9a3412]">
                {parsed.error}
              </p>
            ) : null}
          </li>

          {payload ? (
            <li className="rounded-2xl bg-white p-4">
              <p className="font-display text-sm uppercase tracking-wide text-[#9a3412]">3. Pague</p>
              <div
                className="mx-auto mt-3 flex h-60 w-60 items-center justify-center rounded-2xl border border-[#ead7b8] bg-white"
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
                  <p className="px-4 text-center text-sm font-medium text-ink">
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
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border border-[#ead7b8] bg-paper p-3 font-sans text-xs leading-relaxed text-ink"
              />

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={shareOrCopy}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sunset px-4 text-center text-base font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {PIX_SHARE_LABEL}
                </button>
                <button
                  type="button"
                  onClick={() => copyPayload()}
                  aria-live="off"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-pine px-4 text-base font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {copied ? "Copiado" : "Copiar código"}
                </button>
              </div>
              <p aria-live="polite" className="mt-2 min-h-6 text-sm font-semibold text-pine">
                {status}
              </p>
              <p id={hintId} className="mt-2 text-sm leading-snug text-muted">
                {PIX_HOW_TO_PAY}
              </p>
              <p className="mt-1 text-sm leading-snug text-muted">
                O botão acima usa a lista de compartilhar do celular. Não existe um link único que abra o app de todo banco.
              </p>
            </li>
          ) : (
            <p id={hintId} className="text-sm leading-snug text-muted">
              {PIX_HOW_TO_PAY}
            </p>
          )}
        </ol>
      </div>
    </div>
  );
}
