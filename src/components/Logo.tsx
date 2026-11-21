import Image from "next/image";
import { store } from "@/lib/links";

export function Logo() {
  return (
    <div className="mb-2 flex flex-col items-center">
      <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1.5 shadow-lg ring-4 ring-[#9a3412] sm:h-44 sm:w-44">
        <Image
          src="/logo.png"
          alt="Bike Center Fartura — motos e bicicletas"
          width={176}
          height={176}
          priority
          quality={60}
          className="h-full w-full object-contain"
          sizes="176px"
        />
      </div>
      <h1 className="mt-4 max-w-sm text-center font-display text-[1.7rem] font-semibold leading-tight tracking-wide text-ink">
        Bike Center Fartura — motos e bicicletas em Fartura/SP
      </h1>
      <p className="mt-2 max-w-sm text-center text-base font-medium leading-snug text-muted">
        {store.tagline}
      </p>
      <p className="mt-1 text-center text-base font-semibold text-[#9a3412]">
        {store.trustLine}
      </p>
    </div>
  );
}
