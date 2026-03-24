import Image from "next/image";

export function Logo() {
  return (
    <div className="mb-2 flex flex-col items-center">
      <div
        className="relative inline-flex rounded-2xl bg-[#141414] p-6 shadow-inner ring-1 ring-white/5"
        style={{ isolation: "isolate" }}
      >
        <Image
          src="/logo.jpeg"
          alt="Bike Center Fartura — motos e bicicletas"
          width={280}
          height={120}
          priority
          className="h-auto max-h-28 w-auto max-w-[min(100%,280px)] object-contain mix-blend-multiply contrast-[1.08] brightness-[1.03]"
          sizes="(max-width: 768px) 85vw, 280px"
        />
      </div>
      <p className="mt-4 max-w-sm text-center text-sm font-medium tracking-wide text-zinc-400">
        Motos, bicicletas e acessórios em Fartura/SP
      </p>
    </div>
  );
}
