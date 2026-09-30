import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ExternalLink, Radio } from "lucide-react";
import { listMedia, type MediaItem } from "@/lib/gm7-store.functions";
import { embedUrl } from "@/lib/gm7-format";

export const mediaQuery = queryOptions({ queryKey: ["snnsei-media"], queryFn: () => listMedia(), staleTime: 30_000 });

const PLATFORM_LABEL: Record<string, string> = { kick: "KICK", youtube: "YOUTUBE", tiktok: "TIKTOK", instagram: "INSTAGRAM" };

function LiveCard({ m }: { m: MediaItem }) {
  const src = embedUrl(m.platform, m.url);
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur">
      <div className="relative aspect-video bg-muted">
        {m.isLive && src ? (
          <iframe src={src} title={m.title} className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Radio className="size-10" />
            <span className="font-bold">OFFLINE</span>
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-black ${
            m.isLive ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {m.isLive ? "● LIVE" : "OFFLINE"} · {PLATFORM_LABEL[m.platform]}
        </span>
      </div>
      <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 font-bold hover:text-primary">
        {m.title} <ExternalLink className="size-4" />
      </a>
    </article>
  );
}

function ShortCard({ m }: { m: MediaItem }) {
  const src = embedUrl(m.platform, m.url);
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card/80">
      <div className="aspect-short bg-muted">
        {src ? (
          <iframe src={src} title={m.title} className="h-full w-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen loading="lazy" />
        ) : (
          <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
            <span className="text-lg font-black">{PLATFORM_LABEL[m.platform]}</span>
            <span className="text-xs">افتح في المنصة</span>
          </a>
        )}
      </div>
      <p className="truncate p-3 text-sm font-bold">{m.title}</p>
    </article>
  );
}

export function SnnseiMedia() {
  const { data } = useSuspenseQuery(mediaQuery);
  const live = data.filter((m) => m.kind === "live");
  const videos = data.filter((m) => m.kind === "video");
  const shorts = data.filter((m) => m.kind === "short");
  return (
    <div dir="rtl" className="space-y-10">
      <section>
        <h2 className="mb-4 font-display text-2xl font-black">البث المباشر</h2>
        <div className="grid gap-4 md:grid-cols-2">{live.map((m) => <LiveCard key={m.id} m={m} />)}</div>
      </section>
      {videos.length ? (
        <section>
          <h2 className="mb-4 font-display text-2xl font-black">فيديوهات</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {videos.map((m) => {
              const src = embedUrl(m.platform, m.url);
              return (
                <article key={m.id} className="overflow-hidden rounded-xl border border-border bg-card/80">
                  {src ? <iframe src={src} title={m.title} className="aspect-video w-full" allowFullScreen loading="lazy" /> : null}
                  <p className="p-3 text-sm font-bold">{m.title}</p>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="mb-4 font-display text-2xl font-black">Shorts · TikTok · Reels</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{shorts.map((m) => <ShortCard key={m.id} m={m} />)}</div>
      </section>
    </div>
  );
}
