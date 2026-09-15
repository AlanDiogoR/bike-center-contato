import { store, whatsappSalesLinks } from "@/lib/links";

export function SiteFooter() {
  const phones = whatsappSalesLinks
    .map((link) => link.phoneDisplay)
    .join(" · ");

  return (
    <footer className="mt-2 w-full max-w-md px-4 pb-8 text-center text-xs leading-relaxed text-zinc-500">
      <p className="font-medium text-zinc-400">{store.name}</p>
      <p>{store.address.display}</p>
      <p>WhatsApp {phones}</p>
      <p>
        {store.city}/{store.state}
      </p>
      <p className="mt-3">
        {store.name} © 2026 - Acelerando com você.
      </p>
    </footer>
  );
}
