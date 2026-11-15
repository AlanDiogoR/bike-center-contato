"use client";

import { useRef, useState } from "react";
import {
  FaClock,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaQrcode,
  FaStar,
  FaWhatsapp,
} from "react-icons/fa";
import {
  SiFacebook,
  SiGooglemaps,
  SiInstagram,
  SiMercadopago,
  SiTiktok,
} from "react-icons/si";
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

function SocialIcon({ kind }: { kind: (typeof socialLinks)[number]["icon"] }) {
  const className = "h-6 w-6 shrink-0";
  switch (kind) {
    case "instagram":
      return <SiInstagram className={className} style={{ color: "#C13584" }} aria-hidden />;
    case "tiktok":
      return <SiTiktok className={className} style={{ color: "#171516" }} aria-hidden />;
    case "facebook":
      return <SiFacebook className={className} style={{ color: "#1877F2" }} aria-hidden />;
    default:
      return null;
  }
}

function PixButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
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

const reviewCtas = [
  {
    placa: "hide",
    track: googleReviewLink.prominentLabel,
    ariaLabel: googleReviewLink.prominentLabel,
    size: "min-h-16 text-lg",
    text: "Avalie no Google",
  },
  {
    placa: "show",
    track: "Avaliar no Google",
    ariaLabel: undefined,
    size: "min-h-24 text-2xl text-[clamp(1.125rem,6.2vw,1.5rem)] max-[359px]:gap-2.5 max-[359px]:px-3.5",
    text: "Avaliar no Google",
  },
] as const;

export function LinksSection() {
  return (
    <div className="mx-auto w-full max-w-md px-1 pb-10 pt-2">
      <div className="flex flex-col gap-3">
        {reviewCtas.map((cta) => (
          <a
            key={cta.placa}
            href={googleReviewLink.href}
            target="_blank"
            rel="noopener noreferrer"
            data-placa={cta.placa}
            aria-label={cta.ariaLabel}
            onClick={() =>
              trackOutboundClick(cta.track, googleReviewLink.href, "review")
            }
            className={`animate-pulse-review motion-reduce:animate-none flex w-full min-w-0 items-center gap-4 rounded-2xl bg-sun px-5 py-5 text-left font-bold text-ink ring-2 ring-sunset ${focusRing} ${cta.size}`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
              <FaStar className="h-7 w-7 text-[#9a3412]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 whitespace-nowrap leading-snug">
              {cta.text}
            </span>
            <FaExternalLinkAlt className="h-5 w-5 shrink-0 text-ink" aria-hidden />
          </a>
        ))}

        <PixButton />

        {highlightOffer.enabled ? (
          <a
            href={highlightOffer.href}
            target="_blank"
            rel="noopener noreferrer"
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
            onClick={() => trackOutboundClick(link.label, link.href, "whatsapp")}
            className={`flex min-h-14 items-center gap-4 rounded-2xl bg-pine px-5 py-4 text-left text-base font-semibold text-white ${focusRing}`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <FaWhatsapp className="h-7 w-7 text-white" aria-hidden />
            </span>
            <span className="flex-1 leading-snug">{link.label}</span>
            <FaExternalLinkAlt className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          </a>
        ))}

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
          className={`flex min-h-14 items-center gap-4 rounded-2xl border border-[#ead7b8] bg-white px-5 py-4 text-left text-base font-semibold text-ink ${focusRing}`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper">
            <SiMercadopago className="h-8 w-8" style={{ color: "#3483FA" }} aria-hidden />
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
          <p className="mt-2.5 flex items-start gap-3 text-base font-medium leading-snug text-ink">
            <FaClock className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
            <span>{store.hours.display}</span>
          </p>
        </section>

        <a
          href={googleMapsLink.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackOutboundClick(googleMapsLink.label, googleMapsLink.href, "maps")
          }
          className={`flex min-h-14 items-center gap-4 rounded-2xl border border-[#ead7b8] bg-white px-5 py-4 text-left text-base font-semibold text-ink ${focusRing}`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper">
            <SiGooglemaps className="h-8 w-8" style={{ color: "#1a73e8" }} aria-hidden />
          </span>
          <span className="flex-1 leading-snug">{googleMapsLink.label}</span>
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
            aria-label={`${link.shortLabel}. ${link.label}`}
            onClick={() => trackOutboundClick(link.label, link.href, "social")}
            className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#ead7b8] bg-white px-2 py-3 text-center text-ink ${focusRing}`}
          >
            <SocialIcon kind={link.icon} />
            <span className="text-xs font-semibold leading-tight text-ink">
              {link.shortLabel}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
