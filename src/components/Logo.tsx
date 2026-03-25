export function Logo() {
  return (
    <div className="mb-2 flex flex-col items-center">
      <div className="relative isolate overflow-hidden rounded-2xl bg-zinc-900 p-3 shadow-lg ring-1 ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpeg"
          alt="Bike Center Fartura — motos e bicicletas"
          width={280}
          height={120}
          decoding="async"
          loading="eager"
          className="mx-auto block h-auto max-h-32 w-auto max-w-[min(100%,280px)] object-contain mix-blend-multiply brightness-[1.55] contrast-[1.12] saturate-[1.18]"
        />
      </div>
      <p className="mt-4 max-w-sm text-center text-sm font-medium tracking-wide text-zinc-300">
        Motos, bicicletas e acessórios em Fartura/SP
      </p>
    </div>
  );
}
