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

// Add real clip IDs here: TikTok video ID (digits) / Instagram reel code.
const TIKTOK_IDS: string[] = [];
const INSTA_CODES: string[] = [];

function ShortCards({ kind, ids, href }: { kind: "tiktok" | "instagram"; ids: string[]; href: string }) {
  const [active, setActive] = useState<string | null>(null);
  const src = (id: string) => (kind === "tiktok" ? `https://www.tiktok.com/player/v1/${id}?autoplay=1&music_info=0&description=0` : `https://www.instagram.com/reel/${id}/embed`);
  if (!ids.length)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="mx-auto flex aspect-[9/16] w-full max-w-xs flex-col items-center justify-center gap-3 rounded-2xl border border-primary/40 bg-card/70 p-6 text-center">
        <Play className="size-10 text-primary" />
        <span className="font-black">شاهد المقاطع على الحساب الرسمي</span>
        <ExternalLink className="size-4 text-muted-foreground" />
      </a>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {ids.map((id) => (
        <div key={id} className="relative aspect-[9/16] w-full max-w-full overflow-hidden rounded-2xl border border-border bg-card">
          {active === id ? (
            <iframe src={src(id)} title={kind} className="h-full w-full" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
          ) : (
            <button
              onClick={() => { window.dispatchEvent(new Event("gm7-media-play")); setActive(id); }}
              className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-secondary to-background"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Play className="size-6" /></span>
              <span className="text-xs font-bold text-muted-foreground">تشغيل</span>
            </button>
          )}
        </div>
      ))}
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

const DISCORD_INVITE = "https://discord.gg/5V2tZcrw8";
const DISCORD_ICON = "https://cdn.discordapp.com/icons/657841209259196437/a_efe991a60e3a230993f34eb796387eef.gif?size=256";

function DiscordTab() {
  return (
    <div>
      <Head title="Discord" href={DISCORD_INVITE} text="انضم لمجتمع L'GAMERS LMLA7 • GM7." />
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-primary/40 bg-card/80 p-6 shadow-2xl sm:p-10">
        <div className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <img src={DISCORD_ICON} alt="GM7 Discord" className="mb-4 size-24 rounded-3xl border-2 border-primary/60 shadow-lg" />
          <span className="mb-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-black text-primary">GM7 OFFICIAL SERVER</span>
          <h3 className="mb-2 text-2xl font-black sm:text-3xl">L'GAMERS LMLA7</h3>
          <p className="mb-6 text-sm text-muted-foreground">بطولات، سكريمات، رومات صوتية وأخبار البث في مكان واحد.</p>
          <div className="mb-6 grid w-full max-w-sm grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-2xl font-black">+3,850</p><p className="text-xs text-muted-foreground">عضو</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="flex items-center justify-center gap-2 text-2xl font-black"><span className="size-2.5 animate-pulse rounded-full bg-primary" />+680</p>
              <p className="text-xs text-muted-foreground">متصل الآن</p>
            </div>
          </div>
          <div className="mb-7 flex flex-wrap justify-center gap-2 text-xs font-bold">
            {["🏆 بطولات GM7", "⚔️ سكريمات", "🎙️ رومات صوتية", "💬 دردشة عامة"].map((t) => (
              <span key={t} className="rounded-full border border-border bg-secondary/60 px-3 py-1.5">{t}</span>
            ))}
          </div>
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-lg font-black text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02]">
            انضم إلى سيرفر GM7 <ExternalLink className="size-5" />
          </a>
        </div>
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
      {tab === "instagram" && (<div><Head title="Instagram" href="https://www.instagram.com/snnseii" text="آخر Reels." /><ShortCards key="ig" kind="instagram" ids={INSTA_CODES} href="https://www.instagram.com/snnseii" /></div>)}
      {tab === "tiktok" && (<div><Head title="TikTok" href="https://www.tiktok.com/@snnsei_" text="آخر فيديوهات TikTok." /><ShortCards key="tt" kind="tiktok" ids={TIKTOK_IDS} href="https://www.tiktok.com/@snnsei_" /></div>)}
      {tab === "discord" && <DiscordTab />}
    </section>
  );
}
