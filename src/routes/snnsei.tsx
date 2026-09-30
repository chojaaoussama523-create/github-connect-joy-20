import { createFileRoute } from "@tanstack/react-router";
import { Instagram, MessageCircle, Music2, Play, Radio } from "lucide-react";
import snnseiBg from "@/assets/snnsei-bg.jpg.asset.json";
import snnseiLogo from "@/assets/snnsei-logo.png.asset.json";
import { BrandPage } from "@/components/BrandPage";
import { BrandShell } from "@/components/BrandShell";

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
  { label: "KICK", Icon: Radio, href: "https://kick.com/snnsei" },
  { label: "YOUTUBE", Icon: Play, href: "https://youtube.com/@snnsei" },
  { label: "INSTAGRAM", Icon: Instagram, href: "https://www.instagram.com/snnseii" },
  { label: "TIKTOK", Icon: Music2, href: "https://www.tiktok.com/@snnsei_" },
  { label: "DISCORD", Icon: MessageCircle, href: "https://discord.gg/snnsei" },
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
          {CHANNELS.map(({ label, Icon, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="channel-chip">
              <Icon aria-hidden="true" /> {label}
            </a>
          ))}
        </div>
      </BrandPage>
    </BrandShell>
  );
}
