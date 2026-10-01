import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Crown, Medal, Radio, Trophy, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { MATCH_STATE_LABELS, podiumOf, roundLabel, roundsOf, type Match } from "@/lib/gm7-bracket";
import { formatMad } from "@/lib/gm7-format";
import { initialsOf, officialGameLogo } from "@/lib/gm7-tournament-logos";
import { FORMAT_LABELS, LIFECYCLE_LABELS, toEmbedUrl, type TFormat } from "@/lib/gm7-tournament-meta";
import { listPublicTournaments, registerForTournament, type Tournament } from "@/lib/gm7-tournaments.functions";

export const publicTournamentsQuery = queryOptions({
  queryKey: ["public-tournaments"],
  queryFn: () => listPublicTournaments(),
  refetchInterval: 20_000,
});

const field = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground";

export function GameBadge({ tournament, size = 56 }: { tournament: Tournament; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = tournament.logoUrl || officialGameLogo(tournament.gameName);
  if (src && !failed)
    return (
      <img
        src={src}
        alt={tournament.gameName}
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-xl bg-background/40 object-contain p-1"
      />
    );
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-gradient-to-br from-primary/25 to-accent/20 font-display font-black text-primary"
    >
      {initialsOf(tournament.gameName)}
    </span>
  );
}

export function TournamentsHub() {
  const { data } = useSuspenseQuery(publicTournamentsQuery);
  const [openId, setOpenId] = useState<string | null>(null);
  const live = data.filter((t) => t.status === "active");
  const open = data.filter((t) => t.status === "in_progress");
  const soon = data.filter((t) => t.status === "pending");
  const done = data.filter((t) => t.status === "completed");

  if (data.length === 0)
    return (
      <section dir="rtl" className="rounded-2xl border border-border bg-card/70 p-10 text-center backdrop-blur">
        <Trophy className="mx-auto size-10 text-primary" />
        <p className="mt-3 font-display text-xl font-black">لا توجد بطولات معلنة حالياً</p>
        <p className="mt-1 text-sm text-muted-foreground">ترقبوا الإعلان عن البطولة القادمة.</p>
      </section>
    );

  return (
    <div dir="rtl" className="space-y-10">
      <Group title="جارية الآن" icon={<Radio className="size-5 animate-pulse text-destructive" />} items={live} onOpen={setOpenId} />
      <Group title="التسجيل مفتوح" icon={<Users className="size-5 text-primary" />} items={open} onOpen={setOpenId} />
      <Group title="قادمة" icon={<Calendar className="size-5 text-muted-foreground" />} items={soon} onOpen={setOpenId} />
      <Group title="انتهت" icon={<Crown className="size-5 text-amber-400" />} items={done} onOpen={setOpenId} />
      {openId ? (
        <Modal onClose={() => setOpenId(null)}>
          <TournamentDetail tournament={data.find((t) => t.id === openId)!} onClose={() => setOpenId(null)} />
        </Modal>
      ) : null}
    </div>
  );
}

function Group({
  title,
  icon,
  items,
  onOpen,
}: {
  title: string;
  icon: React.ReactNode;
  items: Tournament[];
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-black">
        {icon} {title}
        <span className="text-sm font-bold text-muted-foreground">({items.length})</span>
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <TournamentCard key={t.id} tournament={t} onOpen={() => onOpen(t.id)} />
        ))}
      </div>
    </section>
  );
}

function TournamentCard({ tournament: t, onOpen }: { tournament: Tournament; onOpen: () => void }) {
  const full = t.registered >= t.slots;
  const cta =
    t.status === "in_progress" ? (full ? "اكتملت المقاعد" : "سجّل الآن") : t.status === "active" ? "مركز المباريات" : t.status === "completed" ? "منصة التتويج" : "التفاصيل";
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur transition hover:border-primary/60">
      <div className="relative h-28 bg-gradient-to-br from-primary/30 via-accent/20 to-background">
        {t.bannerUrl ? <img src={t.bannerUrl} alt="" className="h-full w-full object-cover opacity-70" /> : null}
        <span className="absolute right-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-primary backdrop-blur">
          {LIFECYCLE_LABELS[t.status]}
        </span>
      </div>
      <div className="-mt-8 flex items-start gap-3 px-5">
        <GameBadge tournament={t} />
        <div className="mt-8 min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-black">{t.title}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {t.gameName} · {t.category}
          </p>
        </div>
      </div>
      <div className="px-5 pb-5 pt-3">
        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          <Tag>{t.platform}</Tag>
          <Tag>{t.mode}v{t.mode}</Tag>
          <Tag>{FORMAT_LABELS[t.format as TFormat] ?? t.format}</Tag>
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground">مجموع الجوائز</p>
            <p className="font-display text-xl font-black text-primary">{formatMad(t.prizeMad)}</p>
          </div>
          <div className="text-left">
            <p className="text-[11px] text-muted-foreground">المقاعد</p>
            <p className="font-bold">
              {t.registered}/{t.slots}
            </p>
          </div>
        </div>
        {t.status === "in_progress" ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${Math.min((t.registered / t.slots) * 100, 100)}%` }} />
          </div>
        ) : null}
        <Button className="mt-4 w-full" variant={t.status === "in_progress" && !full ? "default" : "outline"} onClick={onOpen}>
          {cta}
        </Button>
      </div>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">{children}</span>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div dir="rtl" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur">
      <div className="relative my-6 w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-7">
        <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute left-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function TournamentDetail({ tournament: t, onClose }: { tournament: Tournament; onClose: () => void }) {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3 pe-8">
        <GameBadge tournament={t} size={64} />
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl font-black">{t.title}</h2>
          <p className="text-sm text-muted-foreground">
            {t.gameName} · {t.platform} · {t.mode}v{t.mode} · {LIFECYCLE_LABELS[t.status]}
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="مجموع الجوائز" value={formatMad(t.prizeMad)} />
        <Info label="المقاعد" value={`${t.registered}/${t.slots}`} />
        <Info label="الانطلاق" value={t.startsAt ? new Date(t.startsAt).toLocaleDateString("fr-MA") : "—"} />
      </div>

      {t.status === "pending" || t.status === "in_progress" ? (
        <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{t.description || "التفاصيل الكاملة قريباً."}</p>
      ) : null}

      {t.status === "in_progress" ? <RegisterForm tournament={t} onDone={onClose} /> : null}
      {t.status === "active" ? <MatchCenter tournament={t} /> : null}
      {t.status === "completed" ? <Podium tournament={t} /> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-black">{value}</p>
    </div>
  );
}

/* ---------------- Registration ---------------- */

function RegisterForm({ tournament: t, onDone }: { tournament: Tournament; onDone: () => void }) {
  const qc = useQueryClient();
  const submitFn = useServerFn(registerForTournament);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const roster = t.mode;
  const remaining = Math.max(t.slots - t.registered, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    const players = Array.from({ length: Math.max(roster - 1, 0) }, (_, i) => ({
      name: String(f.get(`p${i}name`) ?? "").trim(),
      ign: String(f.get(`p${i}ign`) ?? "").trim(),
    }));
    setBusy(true);
    setError(null);
    try {
      await submitFn({
        data: {
          tournamentId: t.id,
          teamName: String(f.get("teamName") ?? ""),
          captainName: String(f.get("captainName") ?? ""),
          phone: String(f.get("phone") ?? ""),
          discord: String(f.get("discord") ?? ""),
          city: String(f.get("city") ?? ""),
          platformId: String(f.get("platformId") ?? ""),
          players,
        },
      });
      setOk(true);
      qc.invalidateQueries({ queryKey: publicTournamentsQuery.queryKey });
      setTimeout(onDone, 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إرسال التسجيل");
    } finally {
      setBusy(false);
    }
  }

  if (remaining === 0)
    return <p className="rounded-xl border border-border bg-background/60 p-4 text-center text-sm">اكتملت المقاعد — انتظروا القرعة.</p>;

  if (ok)
    return (
      <p className="rounded-xl border border-primary/50 bg-primary/10 p-4 text-center text-sm font-bold text-primary">
        تم إرسال تسجيلك بنجاح ✅ وهو الآن قيد المراجعة.
      </p>
    );

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <p className="text-sm font-bold">
        {roster === 1 ? "تسجيل فردي (Solo 1v1)" : `تسجيل فريق ${roster}v${roster}`} — بقيت {remaining} مقاعد
      </p>
      {roster > 1 ? <input name="teamName" required minLength={2} maxLength={60} placeholder="اسم الفريق *" className={field} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="captainName" required minLength={2} placeholder={roster > 1 ? "اسم الكابتن الكامل *" : "الاسم الكامل *"} className={field} />
        <input name="phone" required placeholder="رقم الهاتف *" dir="ltr" className={field} />
        <input name="platformId" required minLength={2} placeholder="معرّف اللعبة IGN / Riot / Steam / EA ID *" className={field} />
        <input name="city" required minLength={2} placeholder="المدينة *" className={field} />
        <input name="discord" placeholder="Discord ID (اختياري)" dir="ltr" className={`${field} sm:col-span-2`} />
      </div>
      {roster > 1 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground">باقي أعضاء التشكيلة ({roster - 1})</p>
          {Array.from({ length: roster - 1 }, (_, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input name={`p${i}name`} required minLength={2} placeholder={`اسم اللاعب ${i + 2} *`} className={field} />
              <input name={`p${i}ign`} required minLength={2} placeholder={`معرّف اللاعب ${i + 2} *`} className={field} />
            </div>
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "جارٍ الإرسال..." : "إرسال التسجيل"}
      </Button>
    </form>
  );
}

/* ---------------- Match center ---------------- */

export function MatchCenter({ tournament: t }: { tournament: Tournament }) {
  const rounds = roundsOf(t.matches);
  const embed = t.streamUrl ? toEmbedUrl(t.streamUrl) : null;
  return (
    <div className="space-y-5">
      {embed ? (
        <div className="aspect-video overflow-hidden rounded-xl border border-border">
          <iframe src={embed} title="البث المباشر" allowFullScreen className="h-full w-full" />
        </div>
      ) : null}
      {t.discordUrl ? (
        <a href={t.discordUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-primary/50 bg-primary/10 p-3 text-center text-sm font-bold text-primary">
          انضم إلى غرفة الديسكورد المباشرة
        </a>
      ) : null}
      {t.aiNotes ? (
        <p className="whitespace-pre-line rounded-xl border border-border bg-background/60 p-4 text-sm leading-7">{t.aiNotes}</p>
      ) : null}
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-5">
          {rounds.map((round, r) => (
            <div key={r} className="w-56 shrink-0 space-y-3">
              <p className="text-center text-xs font-bold text-muted-foreground">{roundLabel(round.length)}</p>
              {round.map((m) => (
                <MatchBox key={m.id} match={m} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchBox({ match: m }: { match: Match }) {
  const live = m.state === "live";
  return (
    <div className={`rounded-xl border p-3 text-sm ${live ? "border-destructive bg-destructive/10" : "border-border bg-background/60"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate ${m.winner === m.a ? "font-black text-primary" : ""}`}>{m.a ?? "—"}</span>
        <span className="font-mono-code">{m.scoreA ?? "-"}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className={`truncate ${m.winner === m.b ? "font-black text-primary" : ""}`}>{m.b ?? "—"}</span>
        <span className="font-mono-code">{m.scoreB ?? "-"}</span>
      </div>
      <p className={`mt-2 text-[11px] ${live ? "font-bold text-destructive" : "text-muted-foreground"}`}>
        {live ? "● " : ""}
        {MATCH_STATE_LABELS[m.state]}
      </p>
    </div>
  );
}

/* ---------------- Podium ---------------- */

export function Podium({ tournament: t }: { tournament: Tournament }) {
  const podium = t.podium.length ? t.podium : podiumOf(t.matches);
  const split = t.prizeSplit;
  const places = [
    { label: "المركز الأول", icon: <Crown className="size-6 text-amber-400" />, h: "h-28" },
    { label: "المركز الثاني", icon: <Medal className="size-6 text-slate-300" />, h: "h-20" },
    { label: "المركز الثالث", icon: <Medal className="size-6 text-amber-700" />, h: "h-16" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 items-end gap-3">
        {[1, 0, 2].map((i) => (
          <div key={i} className="text-center">
            <div className="flex justify-center">{places[i]!.icon}</div>
            <p className="mt-1 truncate text-sm font-black">{podium[i] ?? "—"}</p>
            <p className="text-[11px] text-primary">{formatMad(Math.round((t.prizeMad * (split[i] ?? 0)) / 100))}</p>
            <div className={`mt-2 rounded-t-lg bg-gradient-to-t from-primary/20 to-primary/60 ${places[i]!.h}`} />
            <p className="text-[11px] text-muted-foreground">{places[i]!.label}</p>
          </div>
        ))}
      </div>
      {t.aiNotes ? <p className="whitespace-pre-line rounded-xl border border-border bg-background/60 p-4 text-sm leading-7">{t.aiNotes}</p> : null}
    </div>
  );
}
