import { store, whatsappSalesLinks } from "@/lib/links";

export function SiteFooter() {
  const phones = whatsappSalesLinks
    .map((link) => link.phoneDisplay)
    .join(" · ");

  return (
    <footer className="mt-2 w-full max-w-md px-4 pb-8 text-center text-sm leading-relaxed text-zinc-300">
      <p className="font-medium text-zinc-100">{store.name}</p>
      <p>{store.address.napDisplay}</p>
      <p>WhatsApp {phones}</p>
      <p>
        {store.city}/{store.state}
      </p>
      <p className="mt-4 text-left text-sm leading-relaxed text-zinc-200">
        {store.citation}
      </p>
      <p className="mt-3 text-xs">
        {store.name} © 2026 - Acelerando com você.
      </p>
    </footer>
  );
}
