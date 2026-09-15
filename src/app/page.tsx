import { LinksSection } from "@/components/LinksSection";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800/95 to-zinc-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #3b82f6 0, transparent 50%), radial-gradient(circle at 80% 0%, #22c55e 0, transparent 45%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center px-4 pb-8 pt-12 sm:pt-16">
        <Logo />
        <div className="w-full flex-1">
          <LinksSection />
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
