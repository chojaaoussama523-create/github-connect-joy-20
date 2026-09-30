import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import marketBg from "@/assets/market-bg.jpg.asset.json";
import marketLogo from "@/assets/gm7-market-logo.png.asset.json";
import { BrandPage } from "@/components/BrandPage";
import { BrandShell } from "@/components/BrandShell";
import { MarketStore, productsQuery } from "@/components/MarketStore";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "GM7 Market — متجر المجتمع" },
      { name: "description", content: "متجر GM7 المغربي: الدفع عند الاستلام والأثمنة بالدرهم." },
      { property: "og:title", content: "GM7 Market — متجر المجتمع" },
      { property: "og:description", content: "منتجات GM7 بالدفع عند الاستلام في كل المغرب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  errorComponent: () => <p className="p-10 text-center text-muted-foreground">تعذر تحميل المتجر.</p>,
  component: MarketPage,
});

function MarketPage() {
  return (
    <BrandShell>
      <BrandPage
        eyebrow="COMMUNITY MARKET"
        title="GM7 MARKET"
        description="متجر GM7 المغربي — الأثمنة بالدرهم والدفع عند الاستلام في جميع المدن."
        logo={marketLogo.url}
        logoAlt="شعار GM7 Market"
        background={marketBg.url}
        accent="market"
      />
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
        <Suspense fallback={<p className="text-muted-foreground">...</p>}>
          <MarketStore />
        </Suspense>
      </div>
    </BrandShell>
  );
}
