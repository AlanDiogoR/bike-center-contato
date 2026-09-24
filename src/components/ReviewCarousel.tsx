"use client";

import { useCallback, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaStar,
  FaWhatsapp,
} from "react-icons/fa";
import { SiGooglemaps, SiInstagram, SiMercadopago } from "react-icons/si";
import { googleReviewLink } from "@/lib/links";
import { trackOutboundClick } from "@/lib/track";

const SLIDES = [
  {
    id: "instagram",
    step: "1",
    title: "Abra o Instagram",
    caption: "Toque no link da bio do @bikecenterfartura para abrir o site.",
  },
  {
    id: "site",
    step: "2",
    title: "Toque em Avalie",
    caption: "No site, toque no botão amarelo “Nos avalie no Google”.",
  },
  {
    id: "maps",
    step: "3",
    title: "Abra a ficha no Maps",
    caption: "O Google Maps abre a Bike Center Fartura na aba Avaliações.",
  },
  {
    id: "escrever",
    step: "4",
    title: "Escreva a avaliação",
    caption: "Toque em “Escrever uma avaliação” e escolha as 5 estrelas.",
  },
  {
    id: "publicar",
    step: "5",
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
      <span className="rounded-full bg-[#ec6e37] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
        {label}
      </span>
    </div>
  );
}

function InstagramSlide() {
  return (
    <PhoneFrame>
      <div className="relative h-[320px] bg-white text-zinc-900">
        <StatusBar />
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-[11px] font-bold">bikecenterfartura</span>
          <SiInstagram className="h-3.5 w-3.5 text-[#E4405F]" aria-hidden />
        </div>
        <div className="flex items-center gap-3 px-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-[#F9AB00] to-[#ec6e37] p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[8px] font-black leading-tight text-[#c95a2e]">
              BC
            </div>
          </div>
          <div className="flex flex-1 justify-around text-center text-[9px] text-zinc-500">
            <div>
              <p className="h-2.5 w-6 rounded bg-zinc-200" />
              <p className="mt-1">pubs</p>
            </div>
            <div>
              <p className="h-2.5 w-8 rounded bg-zinc-200" />
              <p className="mt-1">seguidores</p>
            </div>
            <div>
              <p className="h-2.5 w-6 rounded bg-zinc-200" />
              <p className="mt-1">seguindo</p>
            </div>
          </div>
        </div>
        <div className="px-3 pt-2 text-[10px] leading-snug">
          <p className="font-bold">Bike Center Fartura</p>
          <p className="text-zinc-600">Motos, bikes e acessórios</p>
          <p className="text-zinc-600">Rua Mário Stella, 355</p>
        </div>
        <div className="relative mx-3 mt-2 rounded-lg border-2 border-[#ec6e37] bg-zinc-50 px-2.5 py-2">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-zinc-500">
            Link da bio
          </p>
          <p className="text-[11px] font-bold text-[#00376b] underline">
            Nosso site — toque aqui
          </p>
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ec6e37] text-[10px] font-black text-white shadow">
            1
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-px bg-zinc-200">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gradient-to-br from-zinc-100 to-zinc-200"
            />
          ))}
        </div>
        <TapHint label="Toque no link" />
      </div>
    </PhoneFrame>
  );
}

function SiteSlide() {
  return (
    <PhoneFrame>
      <div className="relative h-[320px] bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 text-white">
        <StatusBar dark />
        <div className="flex flex-col items-center px-3 pt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-[#ec6e37]/50">
            <span className="text-[8px] font-black text-[#ec6e37]">BC</span>
          </div>
          <p className="mt-1 text-center text-[8px] text-zinc-300">
            Motos, bicicletas e acessórios
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-1.5 px-3">
          <div className="flex items-center gap-2 rounded-lg bg-[#25D366] px-2 py-1.5 text-[9px] font-semibold">
            <FaWhatsapp className="h-3 w-3" aria-hidden />
            Conversar no Whats
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFE600] to-[#FFF4A3] px-2 py-1.5 text-[9px] font-semibold text-[#2B4D9E]">
            <SiMercadopago className="h-3 w-3" aria-hidden />
            Loja no Mercado Livre
          </div>
          <div className="relative rounded-lg border-2 border-white bg-gradient-to-r from-[#FBBC05] to-[#F9AB00] px-2 py-2 text-[10px] font-bold text-zinc-900 shadow-lg shadow-amber-500/40">
            <span className="flex items-center gap-2">
              <FaStar className="h-3.5 w-3.5 text-[#E37400]" aria-hidden />
              Nos avalie no Google
            </span>
            <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ec6e37] text-[10px] font-black text-white shadow">
              2
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-[9px] font-semibold text-zinc-100">
            <SiGooglemaps className="h-3 w-3 text-[#4285F4]" aria-hidden />
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
              <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ec6e37] text-[9px] font-black text-white">
                3
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
        <div className="relative mx-3 mt-3 rounded-xl border-2 border-[#ec6e37] bg-[#e8f0fe] px-3 py-3">
          <p className="text-[11px] font-bold text-[#1a73e8]">
            Escrever uma avaliação
          </p>
          <p className="mt-1 text-[9px] text-zinc-600">
            Conte como foi sua visita à loja.
          </p>
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ec6e37] text-[10px] font-black text-white shadow">
            4
          </div>
        </div>
        <div className="mt-3 flex justify-center gap-1 text-[#E37400]">
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
        <div className="mt-3 flex justify-center gap-1 text-[#FBBC05]">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              className="h-6 w-6 drop-shadow-sm"
              aria-hidden
            />
          ))}
        </div>
        <p className="mt-1 text-center text-[9px] font-semibold text-zinc-500">
          5 de 5 estrelas
        </p>
        <div className="mx-3 mt-3 space-y-1.5 rounded-lg bg-zinc-50 p-2">
          <div className="h-2 rounded bg-zinc-200" />
          <div className="h-2 w-5/6 rounded bg-zinc-200" />
          <div className="h-2 w-2/3 rounded bg-zinc-200" />
        </div>
        <div className="relative mx-3 mt-4 rounded-full bg-[#1a73e8] py-2 text-center text-[11px] font-bold text-white shadow">
          Publicar
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ec6e37] text-[10px] font-black text-white shadow">
            5
          </div>
        </div>
        <TapHint label="Toque em Publicar" />
      </div>
    </PhoneFrame>
  );
}

function SlideMockup({ id }: { id: (typeof SLIDES)[number]["id"] }) {
  switch (id) {
    case "instagram":
      return <InstagramSlide />;
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

  const go = useCallback(
    (next: number) => {
      setIndex((next + SLIDES.length) % SLIDES.length);
    },
    [],
  );

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Passo a passo para avaliar no Google"
      className="mx-auto w-full max-w-md pb-2"
    >
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Como nos avaliar
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4 shadow-xl"
        onTouchStart={(event) => setTouchX(event.touches[0].clientX)}
        onTouchEnd={(event) => {
          if (touchX == null) return;
          const dx = event.changedTouches[0].clientX - touchX;
          if (dx > 40) go(index - 1);
          if (dx < -40) go(index + 1);
          setTouchX(null);
        }}
      >
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ec6e37]">
          Passo {slide.step} de {SLIDES.length}
        </p>
        <h2 className="mt-1 text-center text-lg font-bold text-zinc-50">
          {slide.title}
        </h2>

        <div className="relative mt-4 min-h-[320px]" aria-live="polite">
          <SlideMockup id={slide.id} />
        </div>

        <p className="mx-auto mt-4 max-w-xs text-center text-sm leading-snug text-zinc-300">
          {slide.caption}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-zinc-100 transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Slide anterior"
          >
            <FaChevronLeft className="h-4 w-4" aria-hidden />
          </button>

          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
            {SLIDES.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir para o passo ${item.step}: ${item.title}`}
                onClick={() => go(i)}
                className={`h-2.5 rounded-full transition ${
                  i === index
                    ? "w-6 bg-[#ec6e37]"
                    : "w-2.5 bg-zinc-600 hover:bg-zinc-400"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(index + 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-zinc-100 transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Próximo slide"
          >
            <FaChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

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
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FBBC05] to-[#F9AB00] px-4 py-3 text-sm font-bold text-zinc-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBBC05]"
          >
            Avaliar agora no Google
            <FaExternalLinkAlt className="h-3.5 w-3.5" aria-hidden />
          </a>
        ) : null}
      </div>
    </section>
  );
}
