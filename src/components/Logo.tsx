import Image from "next/image";
import { googleMapsPlaceLink, store } from "@/lib/links";

export function Logo() {
  return (
    <div className="mb-2 flex flex-col items-center">
      <div className="flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-full p-2 ring-2 ring-[#ec6e37]/40 shadow-xl sm:h-48 sm:w-48">
        <Image
          src="/logo.png"
          alt="Bike Center Fartura — motos e bicicletas"
          width={220}
          height={220}
          priority
          className="h-full w-full object-contain"
          sizes="(max-width: 640px) 176px, 192px"
        />
      </div>
      <p className="mt-4 max-w-sm text-center text-sm font-medium tracking-wide text-zinc-300">
        {store.tagline}
      </p>
      <a
        href={googleMapsPlaceLink.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 text-center text-sm font-semibold text-[#ec6e37] underline-offset-4 transition hover:text-[#ff8a55] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec6e37]"
      >
        {store.trustLine}
      </a>
    </div>
  );
}
