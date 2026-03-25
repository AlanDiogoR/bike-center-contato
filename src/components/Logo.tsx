import Image from "next/image";

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
        Motos, bicicletas e acessórios em Fartura/SP
      </p>
    </div>
  );
}
