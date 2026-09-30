import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import marketAsset from "@/assets/gm7-market-logo.png.asset.json";
import tournamentsAsset from "@/assets/gm7-tournaments-logo.png.asset.json";
import snnseiAsset from "@/assets/snnsei-logo.png.asset.json";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GM7 SNNSEI — بوابة المجتمع" },
      { name: "description", content: "ادخل إلى عالم GM7 SNNSEI والسوق والبطولات." },
      { property: "og:title", content: "GM7 SNNSEI — بوابة المجتمع" },
      { property: "og:description", content: "ثلاث هويات، مجتمع واحد: SNNSEI وGM7 Market وGM7 Tournaments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SplashPage,
});

function SplashPage() {
  return (
    <main className="splash-page">
      <div className="splash-grid" aria-hidden="true" />
      <div className="splash-content">
        <p className="splash-kicker">WELCOME TO THE COMMUNITY</p>
        <img src={snnseiAsset.url} alt="SNNSEI L'GAMERS LMLA7" className="splash-main-logo" />
        <h1>ثلاث هويات. مجتمع واحد.</h1>
        <p className="splash-copy">منصة GM7 تجمع المحتوى، السوق والبطولات في تجربة واحدة مصممة للاعبين.</p>

        <div className="splash-brands" aria-label="علامات GM7">
          <div className="splash-brand">
            <img src={snnseiAsset.url} alt="SNNSEI" />
            <span>SNNSEI</span>
          </div>
          <div className="splash-brand">
            <img src={marketAsset.url} alt="GM7 Market" />
            <span>MARKET</span>
          </div>
          <div className="splash-brand">
            <img src={tournamentsAsset.url} alt="GM7 Tournaments" />
            <span>TOURNAMENTS</span>
          </div>
        </div>

        <Button asChild size="lg" className="splash-enter h-13 px-8 text-base">
          <Link to="/home">
            ادخل إلى المنصة
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <p className="splash-footer">L&apos;GAMERS LMLA7 • EST. 2026</p>
    </main>
  );
}