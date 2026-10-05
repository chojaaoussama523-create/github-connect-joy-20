import { createFileRoute } from "@tanstack/react-router";
import { Instagram, MessageCircle, Music2, Play, Radio } from "lucide-react";
import snnseiBg from "@/assets/snnsei-bg.jpg.asset.json";
import snnseiLogo from "@/assets/snnsei-logo.png.asset.json";
import { BrandPage } from "@/components/BrandPage";
import { BrandShell } from "@/components/BrandShell";
import { SnnseiSocial } from "@/components/SnnseiSocial";

export const Route = createFileRoute("/snnsei")({
  head: () => ({
    meta: [
      { title: "SNNSEI — GM7" },
      { name: "description", content: "تابع محتوى وبث SNNSEI عبر منصاته الرسمية." },
      { property: "og:title", content: "SNNSEI — GM7" },
      { property: "og:description", content: "البث والمحتوى وقنوات SNNSEI الرسمية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SnnseiPage,
});

const CHANNELS = [
  { label: "KICK", id: "kick", Icon: Radio },
  { label: "YOUTUBE", id: "youtube", Icon: Play },
  { label: "INSTAGRAM", id: "instagram", Icon: Instagram },
  { label: "TIKTOK", id: "tiktok", Icon: Music2 },
  { label: "DISCORD", id: "discord", Icon: MessageCircle },
] as const;

function SnnseiPage() {
  return (
    <BrandShell>
      <BrandPage
        eyebrow="THE CREATOR"
        title="SNNSEI"
        description="المساحة الرسمية لمحتوى Sensei؛ بث مباشر، فيديوهات ولحظات المجتمع في هوية واحدة لا تختلط بالسوق أو البطولات."
        logo={snnseiLogo.url}
        logoAlt="شعار SNNSEI"
        background={snnseiBg.url}
        accent="snnsei"
      >
        <div className="channel-row" aria-label="منصات SNNSEI">
          {CHANNELS.map(({ label, id, Icon }) => (
            <a key={label} href={`#tab-${id}`} className="channel-chip">
              <Icon aria-hidden="true" /> {label}
            </a>
          ))}
        </div>
      </BrandPage>
      <div className="relative mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-3 pb-16 sm:px-5 lg:px-8">
        <SnnseiSocial />
      </div>
    </BrandShell>
  );
}
