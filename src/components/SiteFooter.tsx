import { googleMapsPlaceLink, store, whatsappSalesLinks } from "@/lib/links";

export function SiteFooter() {
  return (
    <footer className="relative mt-2 w-full max-w-md pb-10 text-ink">
      <p className="text-center font-display text-lg font-semibold uppercase tracking-[0.06em]">
        {store.name}
      </p>
      <p className="mt-[0.35rem] text-center text-base leading-[1.35] text-muted">
        {store.footerTagline}
      </p>

      <a
        href={googleMapsPlaceLink.href}
        target="_blank"
        rel="noopener noreferrer"
        className="footer-card flex min-h-11 items-start gap-3 hover:[&_.maps-cta]:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        aria-label={`Ver ${store.name} no Google Maps. ${store.address.napDisplay}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          className="mt-[0.2rem] h-[18px] w-[18px] shrink-0 text-[#9a3412]"
          aria-hidden="true"
        >
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
        </svg>
        <span>
          <span className="block font-semibold leading-[1.35]">
            {store.address.street}
          </span>
          <span className="mt-[0.15rem] block leading-[1.35] text-muted">
            CEP {store.address.postalCode} — {store.city}/{store.state}
          </span>
          <span className="maps-cta mt-[0.4rem] block text-sm font-bold text-[#9a3412]">
            Ver no Google Maps
          </span>
        </span>
      </a>

      <section className="footer-card" aria-labelledby="horarios-heading">
        <h2
          id="horarios-heading"
          className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-[#9a3412]"
        >
          Horários
        </h2>
        <ul className="mt-[0.55rem] text-base">
          {store.hours.rows.map((row) => (
            <li key={row.days} className="footer-hours-row">
              <span>{row.days}</span>
              <span className="font-semibold">{row.hours}</span>
            </li>
          ))}
        </ul>
      </section>

      {whatsappSalesLinks.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-wa min-h-11"
          aria-label={`${link.label} ${link.phoneDisplay}`}
        >
          <span className="footer-wa-icon">
            <svg
              viewBox="0 0 720 720"
              width="20"
              height="20"
              fill="currentColor"
              className="h-5 w-5"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              focusable="false"
            >
              <use href="#icon-whatsapp" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-col leading-[1.25]">
            <span className="text-xs font-semibold tracking-[0.02em] text-white/[0.86]">
              {link.footerLabel}
            </span>
            <span className="text-base font-bold text-white">
              {link.phoneDisplay}
            </span>
          </span>
        </a>
      ))}

      <p className="mt-[0.85rem] text-center text-sm text-muted">
        {store.name} © 2026 - Acelerando com você.
      </p>
    </footer>
  );
}
