import Image from "next/image";

export function Logo() {
  return (
    <div className="mb-2 flex flex-col items-center">
      <div
        className="relative inline-flex rounded-2xl p-2"
        style={{ isolation: "isolate" }}
      >
        <Image
          src="/logo.jpeg"
          alt="Bike Center Fartura — motos e bicicletas"
          width={280}
          height={120}
          priority
          className="h-auto max-h-32 w-auto max-w-[min(100%,280px)] object-contain mix-blend-multiply brightness-[1.14] contrast-[1.08] saturate-[1.05]"
          sizes="(max-width: 768px) 85vw, 280px"
        />
      </div>
      <p className="mt-4 max-w-sm text-center text-sm font-medium tracking-wide text-zinc-300">
        Motos, bicicletas e acessórios em Fartura/SP
      </p>
    </div>
  );
}
