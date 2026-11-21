"use client";

import { useRef, useState } from "react";
import {
  FaClock,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaQrcode,
  FaStar,
} from "react-icons/fa";
import {
  SiFacebook,
  SiGooglemaps,
  SiInstagram,
  SiTiktok,
} from "react-icons/si";
import { MercadoLivreIcon } from "@/components/BrandSymbols";
import { PixModal } from "@/components/PixModal";
import {
  googleMapsLink,
  googleReviewLink,
  highlightOffer,
  mercadoLivreLink,
  socialLinks,
  store,
  whatsappSalesLinks,
} from "@/lib/links";
import { PIX_BUTTON_LABEL } from "@/lib/pix";
import { trackOutboundClick } from "@/lib/track";
import { ReviewCarousel } from "@/components/ReviewCarousel";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/**
 * Critério único dos ícones de rede: glifo monocromático (Simple Icons) na cor
 * oficial sólida de cada marca. Sem degradê, sem fundo e sem cor por variante.
 */
const SOCIAL_ICON_COLORS = {
  instagram: "#C13584",
  tiktok: "#171516",
  facebook: "#1877F2",
} as const;

const SOCIAL_ICONS = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  facebook: SiFacebook,
} as const;

function SocialIcon({ kind }: { kind: (typeof socialLinks)[number]["icon"] }) {
  const Icon = SOCIAL_ICONS[kind];
  return (
    <Icon
      className="h-6 w-6 shrink-0"
      style={{ color: SOCIAL_ICON_COLORS[kind] }}
      data-icon={kind}
      aria-hidden
    />
  );
}

function PixButton({
  "data-placa": dataPlaca,
}: {
  "data-placa"?: "show" | "hide";
} = {}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-placa={dataPlaca}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          trackOutboundClick(PIX_BUTTON_LABEL, "modal:pix", "pix");
          setOpen(true);
        }}
        className={`group flex min-h-14 w-full items-center gap-4 rounded-2xl border-2 border-sunset bg-white px-5 py-4 text-left text-base font-bold text-ink shadow-sm ${focusRing}`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sunset/15">
          <FaQrcode className="h-7 w-7 text-ink" aria-hidden />
        </span>
        <span className="flex-1 leading-snug">{PIX_BUTTON_LABEL}</span>
      </button>
      {open ? (
        <PixModal onClose={() => setOpen(false)} triggerRef={triggerRef} />
      ) : null}
    </>
  );
}

export function LinksSection() {
  return (
    <div className="mx-auto w-full max-w-md px-1 pb-10 pt-2">
      <div className="flex flex-col gap-3">
        <a
          href={googleReviewLink.href}
          target="_blank"
          rel="noopener noreferrer"
          data-placa="show"
          onClick={() =>
            trackOutboundClick(
              "Avaliar no Google",
              googleReviewLink.href,
              "review",
            )
          }
          className={`animate-pulse-review motion-reduce:animate-none flex w-full min-w-0 items-center gap-4 rounded-2xl bg-sun px-5 py-5 text-left font-bold text-ink ring-2 ring-sunset ${focusRing} min-h-24 text-2xl text-[clamp(1.125rem,6.2vw,1.5rem)] max-[359px]:gap-2.5 max-[359px]:px-3.5`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
            <FaStar className="h-7 w-7 text-[#9a3412]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 whitespace-nowrap leading-snug">
            Avaliar no Google
          </span>
          <FaExternalLinkAlt className="h-5 w-5 shrink-0 text-ink" aria-hidden />
        </a>

        <PixButton data-placa="show" />

        {highlightOffer.enabled ? (
          <a
            href={highlightOffer.href}
            target="_blank"
            rel="noopener noreferrer"
            data-placa="show"
            onClick={() =>
              trackOutboundClick(
                highlightOffer.label,
                highlightOffer.href,
                "highlight",
              )
            }
            className={`flex min-h-14 items-center gap-4 rounded-2xl bg-sunset px-5 py-4 text-left text-base font-bold text-ink ${focusRing}`}
          >
            <span className="flex-1 leading-snug">{highlightOffer.label}</span>
            <FaExternalLinkAlt className="h-5 w-5 shrink-0" aria-hidden />
          </a>
        ) : null}

        {whatsappSalesLinks.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            onClick={() => trackOutboundClick(link.label, link.href, "whatsapp")}
            className="cta-wa min-h-14"
          >
            <span className="cta-wa-icon">
              <svg
                viewBox="0 0 720 720"
                width="24"
                height="24"
                fill="currentColor"
                className="h-6 w-6 text-white"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
                focusable="false"
              >
                <use href="#icon-whatsapp" />
              </svg>
            </span>
            <span className="flex-1 leading-snug">
              Conversar no WhatsApp{" "}
              <span className="whitespace-nowrap">({link.carrier})</span>
            </span>
            <FaExternalLinkAlt className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          </a>
        ))}

        <PixButton data-placa="hide" />

        {highlightOffer.enabled ? (
          <a
            href={highlightOffer.href}
            target="_blank"
            rel="noopener noreferrer"
            data-placa="hide"
            onClick={() =>
              trackOutboundClick(
                highlightOffer.label,
                highlightOffer.href,
                "highlight",
              )
            }
            className={`flex min-h-14 items-center gap-4 rounded-2xl bg-sunset px-5 py-4 text-left text-base font-bold text-ink ${focusRing}`}
          >
            <span className="flex-1 leading-snug">{highlightOffer.label}</span>
            <FaExternalLinkAlt className="h-5 w-5 shrink-0" aria-hidden />
          </a>
        ) : null}

        <a
          href={googleReviewLink.href}
          target="_blank"
          rel="noopener noreferrer"
          data-placa="hide"
          aria-label={`${googleReviewLink.label} — ${store.name}`}
          onClick={() =>
            trackOutboundClick(
              googleReviewLink.label,
              googleReviewLink.href,
              "review",
            )
          }
          className={`flex min-h-14 w-full min-w-0 items-center gap-4 rounded-2xl bg-white px-5 py-4 text-left text-base font-semibold text-ink ring-1 ring-[#ead7b8] ${focusRing}`}
        >
          <span className="cta-card-icon">
            <FaStar className="h-6 w-6 text-[#9a3412]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 whitespace-nowrap leading-snug">
            {googleReviewLink.label}
          </span>
          <FaExternalLinkAlt className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        </a>

        <a
          href={mercadoLivreLink.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackOutboundClick(
              mercadoLivreLink.label,
              mercadoLivreLink.href,
              "mercado_livre",
            )
          }
          className="cta-card min-h-14"
        >
          <span className="cta-card-icon">
            <MercadoLivreIcon className="h-8 w-8 shrink-0" />
          </span>
          <span className="flex-1 leading-snug">{mercadoLivreLink.label}</span>
          <FaExternalLinkAlt className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        </a>

        <section
          aria-labelledby="loja-fisica-heading"
          className="rounded-2xl border border-[#ead7b8] bg-white px-5 py-4"
        >
          <h2
            id="loja-fisica-heading"
            className="font-display text-sm uppercase tracking-[0.16em] text-[#9a3412]"
          >
            Loja física
          </h2>
          <p className="mt-3 flex items-start gap-3 text-base font-medium leading-snug text-ink">
            <FaMapMarkerAlt className="mt-1 h-4 w-4 shrink-0 text-[#9a3412]" aria-hidden />
            <span>{store.address.display}</span>
          </p>
          <div className="mt-2.5 flex items-start gap-3 text-base font-medium leading-snug text-ink">
            <FaClock className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
            <ul className="min-w-0 flex-1" aria-label="Horários">
              {store.hours.rows.map((row) => (
                <li key={row.days} className="flex justify-between gap-3">
                  <span>{row.days}</span>
                  <span className="font-semibold">{row.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <a
          href={googleMapsLink.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={googleMapsLink.label}
          onClick={() =>
            trackOutboundClick(googleMapsLink.label, googleMapsLink.href, "maps")
          }
          className="cta-card min-h-14"
        >
          <span className="cta-card-icon">
            <SiGooglemaps className="h-8 w-8" style={{ color: "#1a73e8" }} aria-hidden />
          </span>
          <span className="flex-1 leading-snug">
            {googleMapsLink.action} —{" "}
            <span className="whitespace-nowrap">{googleMapsLink.brand}</span>
          </span>
          <FaExternalLinkAlt className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        </a>
      </div>

      <div className="mt-8" data-placa="hide">
        <ReviewCarousel />
      </div>

      <p className="mb-3 mt-10 text-center font-display text-sm uppercase tracking-[0.18em] text-muted">
        Redes sociais
      </p>

      <div className="grid grid-cols-3 gap-3">
        {socialLinks.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            onClick={() => trackOutboundClick(link.label, link.href, "social")}
            className="social-card"
          >
            <SocialIcon kind={link.icon} />
            <span className="text-xs font-semibold leading-tight text-ink">
              {link.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
