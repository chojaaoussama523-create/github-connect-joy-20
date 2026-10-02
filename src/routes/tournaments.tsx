import { createFileRoute } from "@tanstack/react-router";
import tournamentsBg from "@/assets/tournaments-bg.jpg.asset.json";
import tournamentsLogo from "@/assets/gm7-tournaments-logo.png.asset.json";
import { BrandPage } from "@/components/BrandPage";
import { BrandShell } from "@/components/BrandShell";
import { Suspense } from "react";
import { TournamentsHub, publicTournamentsQuery } from "@/components/TournamentsPublic";

export const Route = createFileRoute("/tournaments")({
  head: () => ({
    meta: [
      { title: "GM7 Tournaments — البطولات" },
      { name: "description", content: "قسم بطولات ومسابقات مجتمع GM7." },
      { property: "og:title", content: "GM7 Tournaments — البطولات" },
      { property: "og:description", content: "البطولات والمنافسات الرسمية لمجتمع GM7." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicTournamentsQuery),
  notFoundComponent: () => <p className="p-10 text-center">غير موجود.</p>,
  errorComponent: () => <p className="p-10 text-center">تعذر تحميل البطولات.</p>,
  component: TournamentsPage,
});

function TournamentsPage() {
  return (
    <BrandShell>
      <BrandPage
        eyebrow="COMMUNITY LEAGUE"
        title="GM7 TOURNAMENTS"
        description="ساحة المنافسة الرسمية لمجتمع L'GAMERS LMLA7، بهوية مستقلة للبطولات والمسابقات القادمة."
        logo={tournamentsLogo.url}
        logoAlt="شعار GM7 Tournaments"
        background={tournamentsBg.url}
        accent="tournaments"
      />
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
        <Suspense fallback={null}><TournamentsHub /></Suspense>
      </div>
    </BrandShell>
  );
}