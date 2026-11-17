"use client";

import { useCallback, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaStar,
} from "react-icons/fa";
import { SiGooglemaps } from "react-icons/si";
import { MercadoLivreIcon } from "@/components/BrandSymbols";
import { googleReviewLink } from "@/lib/links";
import { trackOutboundClick } from "@/lib/track";

const SLIDES = [
  {
    id: "site",
    step: "1",
    title: "Toque em Avalie",
    caption: "No site, toque no botão amarelo “Avalie a Bike Center no Google”.",
  },
  {
    id: "maps",
    step: "2",
    title: "Abra a ficha no Maps",
    caption: "O Google Maps abre a Bike Center Fartura na aba Avaliações.",
  },
  {
    id: "escrever",
    step: "3",
    title: "Escreva a avaliação",
    caption:
      "Toque em “Escrever uma avaliação” e conte como foi sua experiência.",
  },
  {
    id: "publicar",
    step: "4",
    title: "Publique",
    caption: "Confira o texto e toque em Publicar. Obrigado pelo apoio!",
  },
] as const;

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[214px] rounded-[1.7rem] border-[3px] border-zinc-700 bg-zinc-950 p-[5px] shadow-2xl shadow-black/50">
      <div className="relative overflow-hidden rounded-[1.35rem] bg-white">
        <div className="absolute left-1/2 top-1.5 z-10 h-3.5 w-16 -translate-x-1/2 rounded-full bg-zinc-900" />
        {children}
      </div>
    </div>
  );
}

function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-3.5 pb-1 pt-5 text-[9px] font-semibold ${
        dark ? "text-zinc-200" : "text-zinc-800"
      }`}
    >
      <span>9:41</span>
      <span className="tracking-widest">••••</span>
    </div>
  );
}

function TapHint({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center">
      <span className="rounded-full bg-sunset px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink shadow-lg">
        {label}
      </span>
    </div>
  );
}

function StepBadge({ n }: { n: string }) {
  return (
    <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-sunset text-[10px] font-black text-ink shadow">
      {n}
    </div>
  );
}

function SiteSlide() {
  return (
    <PhoneFrame>
      <div className="relative h-[320px] bg-paper text-ink">
        <StatusBar />
        <div className="flex flex-col items-center px-3 pt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-2 ring-[#9a3412]">
            <span className="text-[8px] font-black text-ink">BC</span>
          </div>
          <p className="mt-1 text-center text-[8px] font-medium text-muted">
            Motos, bicicletas e acessórios
          </p>
          <p className="text-center text-[8px] font-semibold text-[#9a3412]">
            Fartura/SP
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-1.5 px-3">
          <div className="relative rounded-xl bg-sun px-2 py-2 text-[10px] font-bold text-ink ring-2 ring-sunset">
            <span className="flex items-center gap-1.5">
              <FaStar className="h-3.5 w-3.5 text-[#9a3412]" aria-hidden />
              Avalie a Bike Center no Google
            </span>
            <StepBadge n="1" />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-pine px-2 py-1.5 text-[9px] font-semibold text-white">
            <svg
              viewBox="0 0 720 720"
              width="12"
              height="12"
              fill="currentColor"
              className="h-3 w-3 shrink-0"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              focusable="false"
            >
              <use href="#icon-whatsapp" />
            </svg>
            Conversar no WhatsApp
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#ead7b8] bg-white px-2 py-1.5 text-[9px] font-semibold text-ink">
            <MercadoLivreIcon className="h-3.5 w-3.5 shrink-0" />
            Loja no Mercado Livre
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#ead7b8] bg-white px-2 py-1.5 text-[9px] font-semibold text-ink">
            <SiGooglemaps className="h-3 w-3" style={{ color: "#1a73e8" }} aria-hidden />
            Como chegar
          </div>
        </div>
        <TapHint label="Toque no botão" />
      </div>
    </PhoneFrame>
  );
}

function MapsSlide() {
  return (
    <PhoneFrame>
      <div className="relative h-[320px] bg-[#e8eef2] text-zinc-900">
        <StatusBar />
        <div className="mx-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-medium shadow">
          Bike Center Fartura
        </div>
        <div className="relative mx-2 mt-2 h-24 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-200 via-lime-100 to-amber-100">
          <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#EA4335] shadow" />
          <p className="absolute bottom-1 right-1 rounded bg-white/80 px-1 text-[8px] font-semibold">
            Maps
          </p>
        </div>
        <div className="mt-2 rounded-t-2xl bg-white px-3 pt-2.5">
          <p className="text-[12px] font-bold">Bike Center Fartura</p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#E37400]">
            <FaStar className="h-3 w-3" aria-hidden />
            Avaliações da loja
          </p>
          <p className="mt-0.5 text-[9px] text-zinc-500">
            Rua Mário Stella, 355 · Fartura/SP
          </p>
          <div className="mt-2 flex gap-3 border-b border-zinc-200 text-[10px]">
            <span className="text-zinc-500">Visão geral</span>
            <span className="relative border-b-2 border-[#1a73e8] pb-1 font-bold text-[#1a73e8]">
              Avaliações
              <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-sunset text-[9px] font-black text-ink">
                2
              </span>
            </span>
          </div>
          <div className="space-y-1.5 py-2">
            <div className="h-2 rounded bg-zinc-100" />
            <div className="h-2 w-4/5 rounded bg-zinc-100" />
          </div>
        </div>
        <TapHint label="Aba Avaliações" />
      </div>
    </PhoneFrame>
  );
}

function WriteReviewSlide() {
  return (
    <PhoneFrame>
      <div className="relative h-[320px] bg-white text-zinc-900">
        <StatusBar />
        <p className="px-3 text-[12px] font-bold">Avaliações</p>
        <p className="px-3 text-[9px] text-zinc-500">Bike Center Fartura</p>
        <div className="relative mx-3 mt-3 rounded-xl border-2 border-sunset bg-[#e8f0fe] px-3 py-3">
          <p className="text-[11px] font-bold text-[#1a73e8]">
            Escrever uma avaliação
          </p>
          <p className="mt-1 text-[9px] text-zinc-600">
            Conte como foi sua visita à loja.
          </p>
          <StepBadge n="3" />
        </div>
        <div className="mt-3 flex justify-center gap-1 text-zinc-300">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar key={i} className="h-5 w-5" aria-hidden />
          ))}
        </div>
        <div className="mx-3 mt-3 space-y-2">
          <div className="h-2 rounded bg-zinc-100" />
          <div className="h-2 w-4/5 rounded bg-zinc-100" />
          <div className="h-2 w-2/3 rounded bg-zinc-100" />
        </div>
        <TapHint label="Escrever avaliação" />
      </div>
    </PhoneFrame>
  );
}

function PublishSlide() {
  return (
    <PhoneFrame>
      <div className="relative h-[320px] bg-white text-zinc-900">
        <StatusBar />
        <p className="px-3 text-[12px] font-bold">Sua avaliação</p>
        <p className="px-3 text-[9px] text-zinc-500">Bike Center Fartura</p>
        <div className="mt-3 flex justify-center gap-1 text-zinc-300">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar key={i} className="h-6 w-6" aria-hidden />
          ))}
        </div>
        <div className="mx-3 mt-3 space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5">
          <p className="text-[9px] font-medium text-zinc-600">
            Conte como foi sua experiência
          </p>
          <div className="h-2 rounded bg-zinc-200" />
          <div className="h-2 w-5/6 rounded bg-zinc-200" />
        </div>
        <div className="relative mx-3 mt-4 rounded-full bg-[#1a73e8] py-2 text-center text-[11px] font-bold text-white shadow">
          Publicar
          <StepBadge n="4" />
        </div>
        <TapHint label="Toque em Publicar" />
      </div>
    </PhoneFrame>
  );
}

function SlideMockup({ id }: { id: (typeof SLIDES)[number]["id"] }) {
  switch (id) {
    case "site":
      return <SiteSlide />;
    case "maps":
      return <MapsSlide />;
    case "escrever":
      return <WriteReviewSlide />;
    case "publicar":
      return <PublishSlide />;
    default:
      return null;
  }
}

export function ReviewCarousel() {
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const slide = SLIDES[index];
  const last = SLIDES.length - 1;

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Passo a passo para avaliar no Google"
      className="mx-auto w-full max-w-md pb-2"
    >
      <p className="mb-3 text-center font-display text-sm uppercase tracking-[0.18em] text-muted">
        Como nos avaliar
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border border-[#ead7b8] bg-white p-4 shadow-sm"
        onTouchStart={(event) => setTouchX(event.touches[0].clientX)}
        onTouchEnd={(event) => {
          if (touchX == null) return;
          const dx = event.changedTouches[0].clientX - touchX;
          if (dx > 40) go(index - 1);
          if (dx < -40) go(index + 1);
          setTouchX(null);
        }}
      >
        <p className="text-center font-display text-xs uppercase tracking-[0.16em] text-[#9a3412]">
          Passo {slide.step} de {SLIDES.length}
        </p>
        <h2 className="mt-1 flex min-h-12 items-center justify-center text-center font-display text-2xl uppercase leading-none text-ink">
          {slide.title}
        </h2>

        <div className="relative mt-4 min-h-[320px]" aria-live="polite">
          <SlideMockup id={slide.id} />
        </div>

        <p className="mx-auto mt-4 flex min-h-20 max-w-xs items-start justify-center text-center text-base leading-snug text-muted">
          {slide.caption}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ead7b8] bg-paper text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            aria-label="Slide anterior"
          >
            <FaChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ead7b8] bg-paper text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            aria-label="Próximo slide"
          >
            <FaChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div
          className="mt-2 flex flex-wrap items-center justify-center"
          role="tablist"
          aria-label="Slides"
        >
          {SLIDES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir para o passo ${item.step}: ${item.title}`}
              onClick={() => go(i)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span
                className={`block h-2.5 w-2.5 origin-center rounded-full bg-[#8a6a48] motion-reduce:transform-none ${
                  i === index ? "scale-x-[2.4] bg-[#9a3412]" : ""
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-4 h-12" data-testid="review-cta-slot">
          {index === last ? (
            <a
              href={googleReviewLink.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackOutboundClick(
                  googleReviewLink.label,
                  googleReviewLink.href,
                  "review",
                )
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sun px-4 text-base font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Avaliar agora no Google
              <FaExternalLinkAlt className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
