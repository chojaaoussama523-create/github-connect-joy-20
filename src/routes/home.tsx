import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag, Swords, Tv } from "lucide-react";
import marketBg from "@/assets/gm7-market-4k.jpg.asset.json";
import marketLogo from "@/assets/gm7-market-logo.png.asset.json";
import tournamentsBg from "@/assets/gm7-tournaments-4k.jpg.asset.json";
import tournamentsLogo from "@/assets/gm7-tournaments-logo.png.asset.json";
import snnseiLogo from "@/assets/snnsei-logo.png.asset.json";
import snnseiMascot from "@/assets/snnsei-mascot.png.asset.json";
import { BrandShell } from "@/components/BrandShell";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية — GM7 SNNSEI" },
      { name: "description", content: "اختر وجهتك بين محتوى SNNSEI ومتجر GM7 وبطولات المجتمع." },
      { property: "og:title", content: "الرئيسية — GM7 SNNSEI" },
      { property: "og:description", content: "المركز الموحد لمحتوى SNNSEI وسوق GM7 والبطولات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const BRANDS = [
  {
    to: "/snnsei",
    label: "SNNSEI",
    description: "البث، المحتوى وكل قنوات Sensei في مركز واحد.",
    logo: snnseiLogo.url,
    background: snnseiMascot.url,
    Icon: Tv,
    tone: "snnsei",
  },
  {
    to: "/market",
    label: "GM7 MARKET",
    description: "وجهة المجتمع للمنتجات والعروض المختارة.",
    logo: marketLogo.url,
    background: marketBg.url,
    Icon: ShoppingBag,
    tone: "market",
  },
  {
    to: "/tournaments",
    label: "GM7 TOURNAMENTS",
    description: "المنافسات، البطولات وصناعة الأبطال.",
    logo: tournamentsLogo.url,
    background: tournamentsBg.url,
    Icon: Swords,
    tone: "tournaments",
  },
] as const;

function HomePage() {
  return (
    <BrandShell>
      <section className="home-intro">
        <p className="brand-eyebrow">GM7 COMMUNITY HUB</p>
        <h1>اختر عالمك</h1>
        <p>ثلاث مساحات مستقلة بهوية واضحة، تجمعها روح مجتمع L&apos;GAMERS LMLA7.</p>
      </section>

      <section className="brand-grid" aria-label="أقسام GM7">
        {BRANDS.map(({ to, label, description, logo, background, Icon, tone }) => (
          <Link key={to} to={to} className={`brand-card brand-card-${tone}`}>
            <img src={background} alt="" className="brand-card-bg" aria-hidden="true" />
            <div className="brand-card-overlay" aria-hidden="true" />
            <div className="brand-card-content">
              <Icon className="brand-card-icon" aria-hidden="true" />
              <img src={logo} alt={label} className="brand-card-logo" />
              <div>
                <h2>{label}</h2>
                <p>{description}</p>
              </div>
              <span className="brand-card-link">
                اكتشف القسم <ArrowLeft aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </section>
    </BrandShell>
  );
}