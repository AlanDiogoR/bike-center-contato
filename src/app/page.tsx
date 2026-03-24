import { LinksSection } from "@/components/LinksSection";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#080808] via-[#101010] to-[#080808]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #3b82f6 0, transparent 45%), radial-gradient(circle at 80% 0%, #22c55e 0, transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center px-4 pb-8 pt-12 sm:pt-16">
        <Logo />
        <div className="w-full flex-1">
          <LinksSection />
        </div>
        <footer className="mt-8 w-full max-w-md px-4 pb-8 text-center text-xs text-zinc-600">
          Bike Center Fartura © 2026 - Acelerando com você.
        </footer>
      </div>
    </main>
  );
}
