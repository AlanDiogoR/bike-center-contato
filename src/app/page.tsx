import { LinksSection } from "@/components/LinksSection";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-paper text-ink">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,197,27,0.55),transparent_68%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center px-4 pb-8 pt-8 sm:pt-12">
        <Logo />
        <div className="w-full flex-1">
          <LinksSection />
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
