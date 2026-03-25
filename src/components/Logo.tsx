export function Logo() {
  return (
    <div className="mb-2 flex flex-col items-center">
      <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-lg ring-1 ring-zinc-700/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpeg"
          alt="Bike Center Fartura — motos e bicicletas"
          width={280}
          height={120}
          decoding="async"
          loading="eager"
          className="mx-auto block h-auto max-h-32 w-auto max-w-[min(100%,280px)] object-contain"
        />
      </div>
      <p className="mt-4 max-w-sm text-center text-sm font-medium tracking-wide text-zinc-300">
        Motos, bicicletas e acessórios em Fartura/SP
      </p>
    </div>
  );
}
