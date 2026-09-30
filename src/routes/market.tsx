import { createFileRoute } from "@tanstack/react-router";
import marketBg from "@/assets/market-bg.jpg.asset.json";
import marketLogo from "@/assets/gm7-market-logo.png.asset.json";
import { BrandPage } from "@/components/BrandPage";
import { BrandShell } from "@/components/BrandShell";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "GM7 Market — متجر المجتمع" },
      { name: "description", content: "واجهة GM7 Market المستقلة للمنتجات والعروض." },
      { property: "og:title", content: "GM7 Market — متجر المجتمع" },
      { property: "og:description", content: "منتجات وعروض مختارة لمجتمع GM7." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  return (
    <BrandShell>
      <BrandPage
        eyebrow="COMMUNITY MARKET"
        title="GM7 MARKET"
        description="مساحة المتجر الرسمية بهويتها الذهبية والزرقاء، مخصصة لمنتجات المجتمع والعروض القادمة."
        logo={marketLogo.url}
        logoAlt="شعار GM7 Market"
        background={marketBg.url}
        accent="market"
      />
    </BrandShell>
  );
}