import Image from "next/image";

export function Logo() {
  return (
    <div className="mb-2 flex flex-col items-center">
      <div className="relative inline-flex overflow-hidden rounded-2xl bg-zinc-100 p-4 shadow-xl shadow-black/30 ring-1 ring-zinc-300/80">
        <Image
          src="/logo.jpeg"
          alt="Bike Center Fartura — motos e bicicletas"
          width={280}
          height={120}
          priority
          className="h-auto max-h-32 w-auto max-w-[min(100%,280px)] object-contain"
          sizes="(max-width: 768px) 85vw, 280px"
        />
      </div>
      <p className="mt-4 max-w-sm text-center text-sm font-medium tracking-wide text-zinc-300">
        Motos, bicicletas e acessórios em Fartura/SP
      </p>
    </div>
  );
}
