import { store, whatsappSalesLinks } from "@/lib/links";

export function SiteFooter() {
  const phones = whatsappSalesLinks
    .map((link) => link.phoneDisplay)
    .join(" · ");

  return (
    <footer className="mt-2 w-full max-w-md px-4 pb-10 text-center text-base leading-relaxed text-muted">
      <p className="font-display text-lg uppercase tracking-wide text-ink">{store.name}</p>
      <p>{store.address.napDisplay}</p>
      <p>WhatsApp {phones}</p>
      <p>
        {store.city}/{store.state}
      </p>
      <p className="mt-4 text-left text-base leading-relaxed text-ink">
        {store.citation}
      </p>
      <p className="mt-3 text-sm">
        {store.name} © 2026 - Acelerando com você.
      </p>
    </footer>
  );
}
