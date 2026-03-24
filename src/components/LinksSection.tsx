"use client";

import { motion } from "framer-motion";
import { FaExternalLinkAlt, FaWhatsapp } from "react-icons/fa";
import {
  SiFacebook,
  SiGooglemaps,
  SiInstagram,
  SiMercadopago,
  SiTiktok,
} from "react-icons/si";
import {
  googleMapsLink,
  mercadoLivreLink,
  socialLinks,
  whatsappSalesLinks,
} from "@/lib/links";
import { trackOutboundClick } from "@/lib/track";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function SocialIcon({ kind }: { kind: (typeof socialLinks)[number]["icon"] }) {
  const className = "h-6 w-6 shrink-0";
  switch (kind) {
    case "instagram":
      return (
        <SiInstagram
          className={className}
          style={{
            color: "#E4405F",
            filter: "drop-shadow(0 0 1px rgba(255,255,255,0.15))",
          }}
          aria-hidden
        />
      );
    case "tiktok":
      return (
        <span className="relative inline-flex h-6 w-6 items-center justify-center">
          <SiTiktok
            className="h-6 w-6"
            style={{
              color: "#25F4EE",
              filter: "drop-shadow(0 1px 0 #EE1D52)",
            }}
            aria-hidden
          />
        </span>
      );
    case "facebook":
      return (
        <SiFacebook className={className} style={{ color: "#1877F2" }} aria-hidden />
      );
    default:
      return null;
  }
}

export function LinksSection() {
  return (
    <motion.div
      className="mx-auto w-full max-w-md px-4 pb-16 pt-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col gap-4">
        {whatsappSalesLinks.map((link) => (
          <motion.div key={link.id} variants={item}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackOutboundClick(link.label, link.href, "whatsapp")
              }
              className="group relative flex items-center gap-4 overflow-hidden rounded-xl bg-[#25D366] px-5 py-4 text-left font-semibold text-white shadow-lg shadow-emerald-950/30 transition-transform animate-pulse-soft hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <FaWhatsapp className="h-7 w-7 text-white" aria-hidden />
              </span>
              <span className="flex-1 text-base leading-snug">{link.label}</span>
              <FaExternalLinkAlt
                className="h-5 w-5 shrink-0 opacity-80 transition group-hover:opacity-100"
                aria-hidden
              />
            </a>
          </motion.div>
        ))}

        <motion.div variants={item}>
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
            className="group flex items-center gap-4 rounded-xl border border-[#3483FA]/30 bg-gradient-to-r from-[#FFE600] to-[#FFF4A3] px-5 py-4 text-left font-semibold text-[#2B4D9E] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3483FA]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/60">
              <SiMercadopago
                className="h-9 w-9"
                style={{ color: "#3483FA" }}
                aria-hidden
              />
            </span>
            <span className="flex-1 text-base leading-snug text-[#2B4D9E]">
              {mercadoLivreLink.label}
            </span>
            <FaExternalLinkAlt
              className="h-5 w-5 shrink-0 text-[#3483FA] opacity-90"
              aria-hidden
            />
          </a>
        </motion.div>

        <motion.div variants={item}>
          <a
            href={googleMapsLink.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackOutboundClick(
                googleMapsLink.label,
                googleMapsLink.href,
                "maps",
              )
            }
            className="group flex items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-4 text-left font-semibold text-zinc-100 shadow-md transition hover:-translate-y-0.5 hover:border-[#4285F4]/50 hover:bg-zinc-800/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <SiGooglemaps
                className="h-8 w-8"
                style={{ color: "#4285F4" }}
                aria-hidden
              />
            </span>
            <span className="flex-1 text-base leading-snug">
              {googleMapsLink.label}
            </span>
            <FaExternalLinkAlt
              className="h-5 w-5 shrink-0 text-zinc-500 transition group-hover:text-zinc-300"
              aria-hidden
            />
          </a>
        </motion.div>
      </div>

      <motion.p
        variants={item}
        className="mt-10 mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
      >
        Redes sociais
      </motion.p>

      <div className="flex flex-col gap-3">
        {socialLinks.map((link) => (
          <motion.div key={link.id} variants={item}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackOutboundClick(link.label, link.href, "social")
              }
              className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3.5 text-left text-zinc-100 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              <SocialIcon kind={link.icon} />
              <span className="flex-1 text-sm font-medium leading-snug">
                {link.label}
              </span>
              <FaExternalLinkAlt
                className="h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-zinc-300"
                aria-hidden
              />
            </a>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
