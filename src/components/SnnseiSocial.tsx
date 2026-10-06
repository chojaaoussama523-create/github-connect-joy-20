import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Instagram, ListVideo, Loader2, MessageCircle, Music2, Play, Radio, X } from "lucide-react";
import { getPlaylistVideos, getYoutubeFeed } from "@/lib/youtube.functions";

type Tab = "youtube" | "kick" | "instagram" | "tiktok" | "discord";
const TABS: { id: Tab; label: string; Icon: typeof Play }[] = [
  { id: "youtube", label: "YOUTUBE", Icon: Play },
  { id: "kick", label: "KICK", Icon: Radio },
  { id: "instagram", label: "INSTAGRAM", Icon: Instagram },
  { id: "tiktok", label: "TIKTOK", Icon: Music2 },
  { id: "discord", label: "DISCORD", Icon: MessageCircle },
];

function Elfsight({ appId }: { appId: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const src = "https://elfsightcdn.com/platform.js";
    try {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (!existing) {
        const s = document.createElement("script");
        s.src = src;
        s.defer = true;
        s.onerror = () => setFailed(true);
        document.body.appendChild(s);
      } else {
        (window as unknown as { eapps?: { init?: () => void } }).eapps?.init?.();
      }
    } catch {
      setFailed(true);
    }
  }, [appId]);
  if (failed) return <p className="rounded-xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">تعذر تحميل المحتوى، افتح القناة مباشرة.</p>;
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card/60 p-2 sm:p-4">
      <div className={`elfsight-app-${appId} w-full max-w-full [&_*]:max-w-full`} data-elfsight-app-lazy="" />
    </div>
  );
}

function Head({ title, href, text }: { title: string; href: string; text: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-black">{title}</h2>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-secondary">
        فتح القناة <ExternalLink className="size-4" />
      </a>
    </div>
  );
}

function YouTubeTab() {
  const { data, isLoading, error } = useQuery({ queryKey: ["yt-feed"], queryFn: () => getYoutubeFeed(), staleTime: 300_000 });
  const [sub, setSub] = useState<"videos" | "shorts" | "playlists">("videos");
  const [open, setOpen] = useState<string | null>(null);
  const [pl, setPl] = useState<string | null>(null);
  const plq = useQuery({ queryKey: ["yt-pl", pl], queryFn: () => getPlaylistVideos({ data: { id: pl! } }), enabled: !!pl });

  const list = data?.videos.filter((v) => (sub === "shorts" ? v.short : !v.short)) ?? [];
  return (
    <div>
      <Head title="YouTube" href="https://youtube.com/@snnsei" text="فيديوهات، Shorts وقوائم تشغيل SNNSEI." />
      <div className="mb-5 flex gap-2 border-b border-border">
        {(["videos", "shorts", "playlists"] as const).map((t) => (
          <button key={t} onClick={() => setSub(t)} className={`border-b-2 px-4 py-2 text-sm font-bold ${sub === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
            {t === "videos" ? "الفيديوهات" : t === "shorts" ? "Shorts" : "Playlists"}
          </button>
        ))}
      </div>
      {isLoading && <div className="flex h-60 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> جاري التحميل...</div>}
      {error && <div className="rounded-xl border border-destructive/40 p-6 text-center text-destructive">تعذر تحميل محتوى YouTube.</div>}
      {data && sub !== "playlists" && (
        <div className={sub === "shorts" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
          {list.map((v) => (
            <button key={v.videoId} onClick={() => setOpen(v.videoId)} className="group text-right">
              <div className={`relative overflow-hidden rounded-xl bg-muted ${sub === "shorts" ? "aspect-[9/16]" : "aspect-video"}`}>
                <img src={v.thumbnail} alt={v.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition group-hover:opacity-100"><Play className="size-5" /></span>
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-bold">{v.title}</h3>
              <p className="text-xs text-muted-foreground">{new Intl.NumberFormat("en", { notation: "compact" }).format(v.views)} مشاهدة</p>
            </button>
          ))}
          {!list.length && <p className="col-span-full text-center text-muted-foreground">لا يوجد محتوى.</p>}
        </div>
      )}
      {data && sub === "playlists" && (
        <div className="grid gap-3">
          {data.playlists.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card/60">
              <button onClick={() => setPl(pl === p.id ? null : p.id)} className="flex w-full items-center gap-4 p-3 text-right">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                  <ListVideo className="absolute inset-0 m-auto size-6" />
                </div>
                <div className="flex-1"><h3 className="font-bold">{p.title}</h3><p className="text-xs text-muted-foreground">{p.count} فيديو</p></div>
                <span className="text-xl text-muted-foreground">{pl === p.id ? "−" : "+"}</span>
              </button>
              {pl === p.id && (
                <div className="grid gap-2 px-3 pb-3">
                  {plq.isLoading && <Loader2 className="mx-auto size-5 animate-spin" />}
                  {plq.data?.map((i: { videoId: string; title: string; thumbnail: string }) => (
                    <button key={i.videoId} onClick={() => setOpen(i.videoId)} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-2 text-right hover:bg-secondary">
                      <img src={i.thumbnail} alt="" className="aspect-video w-24 rounded object-cover" />
                      <span className="text-sm">{i.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur" onClick={() => setOpen(null)}>
          <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(null)} aria-label="إغلاق" className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2"><X className="size-5" /></button>
            <div className="aspect-video"><iframe src={`https://www.youtube.com/embed/${open}?autoplay=1&rel=0`} title="YouTube" className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function KickTab() {
  return (
    <div>
      <Head title="Kick" href="https://kick.com/snnsei" text="تابع بث SNNSEI المباشر داخل الموقع." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
          <div className="aspect-video"><iframe src="https://player.kick.com/snnsei" title="SNNSEI Kick Live" className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen /></div>
        </div>
        <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block">
          <iframe src="https://kick.com/popout/snnsei/chat" title="SNNSEI Kick Chat" className="h-full min-h-96 w-full" />
        </div>
      </div>
    </div>
  );
}

function DiscordTab() {
  return (
    <div>
      <Head title="Discord" href="https://discord.gg/snnsei" text="انضم لمجتمع SNNSEI و GM7." />
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card/70 p-8 text-center">
        <MessageCircle className="mx-auto mb-4 size-14 text-primary" />
        <h3 className="mb-2 text-2xl font-black">SNNSEI COMMUNITY</h3>
        <p className="mb-6 text-sm text-muted-foreground">بطولات، بثوث، وأخبار المجتمع في مكان واحد.</p>
        <a href="https://discord.gg/snnsei" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-black text-primary-foreground">
          انضم الآن <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
}

export function SnnseiSocial() {
  const [tab, setTab] = useState<Tab>("youtube");
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace("#tab-", "") as Tab;
      if (TABS.some((t) => t.id === h)) {
        setTab(h);
        document.getElementById("snnsei-tabs")?.scrollIntoView({ behavior: "smooth" });
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return (
    <section id="snnsei-tabs" className="mb-12 min-w-0 scroll-mt-24">
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${tab === id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      {tab === "youtube" && <YouTubeTab />}
      {tab === "kick" && <KickTab />}
      {tab === "instagram" && (<div><Head title="Instagram" href="https://www.instagram.com/snnseii" text="آخر منشورات و Reels." /><Elfsight appId="5ebb7646-cd50-4e82-aaa5-f2094cc5c148" /></div>)}
      {tab === "tiktok" && (<div><Head title="TikTok" href="https://www.tiktok.com/@snnsei_" text="آخر فيديوهات TikTok." /><Elfsight appId="91274312-ea48-44ce-9b2a-7d24b9746e22" /></div>)}
      {tab === "discord" && <DiscordTab />}
    </section>
  );
}
