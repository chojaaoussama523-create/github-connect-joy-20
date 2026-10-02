import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Plus, Shuffle, Trash2, Trophy, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GameCatalog } from "@/components/GameCatalog";
import { roundLabel, roundsOf, type Match } from "@/lib/gm7-bracket";
import { formatMad } from "@/lib/gm7-format";
import { officialGameLogo } from "@/lib/gm7-tournament-logos";
import {
  FORMAT_LABELS,
  LIFECYCLE_LABELS,
  LIFECYCLE_ORDER,
  T_CATEGORIES,
  T_FORMATS,
  T_MODES,
  T_PLATFORMS,
  T_SLOTS,
  type Lifecycle,
} from "@/lib/gm7-tournament-meta";
import { GAMES } from "@/lib/gm7-tournaments";
import {
  adminAiAssist,
  adminCompleteTournament,
  adminDeleteTournament,
  adminListTournaments,
  adminReportScore,
  adminSaveTournament,
  adminSetMatchState,
  adminSetTournamentStatus,
  adminStartDraw,
  type Tournament,
} from "@/lib/gm7-tournaments.functions";

const field = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground";
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "حدث خطأ");

export function TournamentsManager({ access }: { access: string }) {
  const list = useServerFn(adminListTournaments);
  const q = useQuery({ queryKey: ["admin-tournaments"], queryFn: () => list({ data: { access } }) });
  const [modal, setModal] = useState<Tournament | "new" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const data = q.data ?? [];
  const current = data.find((t) => t.id === selected) ?? null;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-black">MANAGER TOURNAMENTS</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCatalog((v) => !v)}>كتالوغ الألعاب</Button>
          <Button onClick={() => setModal("new")}><Plus /> إضافة بطولة</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.map((t) => (
          <article key={t.id} className={`rounded-xl border bg-card/80 p-4 ${selected === t.id ? "border-primary" : "border-border"}`}>
            <div className="flex items-center gap-3">
              <img src={t.logoUrl || officialGameLogo(t.gameName) || ""} alt="" className="size-12 rounded-lg bg-background/40 object-contain p-1" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.gameName} · {t.platform} · {t.mode}v{t.mode}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-bold text-primary">{formatMad(t.prizeMad)}</span>
              <span className="text-muted-foreground">{t.registered}/{t.slots}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full border border-border px-2 py-0.5 text-xs">{LIFECYCLE_LABELS[t.status]}</span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => setModal(t)}>تعديل</Button>
              <Button size="sm" onClick={() => setSelected(t.id)}>إدارة</Button>
            </div>
          </article>
        ))}
        {data.length === 0 && !q.isLoading ? <p className="text-muted-foreground">لا توجد بطولات بعد.</p> : null}
      </div>

      {current ? <Control access={access} t={current} refresh={() => q.refetch()} onClose={() => setSelected(null)} /> : null}
      {showCatalog ? <GameCatalog games={GAMES} title="قاعدة بيانات الألعاب (إدارة)" /> : null}
      {modal ? (
        <TournamentForm access={access} initial={modal === "new" ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); q.refetch(); }} />
      ) : null}
    </div>
  );
}

function L({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block space-y-1 text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TournamentForm({ access, initial, onClose, onSaved }: { access: string; initial: Tournament | null; onClose: () => void; onSaved: () => void }) {
  const save = useServerFn(adminSaveTournament);
  const [gameId, setGameId] = useState(initial?.gameId ?? GAMES[0]!.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const game = GAMES.find((g) => g.id === gameId);
  const gameName = game?.name ?? initial?.gameName ?? gameId;
  const autoLogo = officialGameLogo(gameName);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const opt = (k: string) => s(k) || null;
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          access,
          id: initial?.id,
          title: s("title"),
          description: s("description"),
          category: s("category"),
          gameId,
          gameName,
          platform: s("platform"),
          mode: Number(s("mode")),
          format: s("format"),
          slots: Number(s("slots")),
          prizeMad: Number(s("prize")) || 0,
          prizeSplit: [Number(s("p1")) || 60, Number(s("p2")) || 30, Number(s("p3")) || 10],
          status: s("status") as Lifecycle,
          startsAt: opt("startsAt"),
          logoUrl: opt("logoUrl") ?? autoLogo,
          bannerUrl: opt("bannerUrl"),
          thumbUrl: opt("thumbUrl"),
          discordUrl: opt("discordUrl"),
          streamUrl: opt("streamUrl"),
        },
      });
      onSaved();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur" onClick={onClose}>
      <form dir="rtl" onSubmit={submit} onClick={(e) => e.stopPropagation()} className="my-8 grid w-full max-w-3xl gap-3 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
        <div className="flex items-center justify-between sm:col-span-2">
          <h3 className="font-display text-xl font-black">{initial ? "تعديل البطولة" : "إضافة بطولة"}</h3>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}><X /></Button>
        </div>
        <L label="اسم البطولة" wide><input name="title" required minLength={2} defaultValue={initial?.title} className={field} /></L>
        <L label="الوصف" wide><textarea name="description" rows={3} defaultValue={initial?.description} className={`${field} h-auto py-2`} /></L>
        <L label="الفئة"><select name="category" defaultValue={initial?.category ?? "SPORTS"} className={field}>{T_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></L>
        <L label="المنصة"><select name="platform" defaultValue={initial?.platform ?? "PS5"} className={field}>{T_PLATFORMS.map((c) => <option key={c}>{c}</option>)}</select></L>
        <L label="اللعبة">
          <select value={gameId} onChange={(e) => setGameId(e.target.value)} className={field}>{GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        </L>
        <L label="الشعار الرسمي (تلقائي أو رابط)">
          <div className="flex items-center gap-2">
            {autoLogo ? <img src={autoLogo} alt="" className="size-10 object-contain" /> : null}
            <input name="logoUrl" type="url" defaultValue={initial?.logoUrl ?? ""} placeholder={autoLogo ?? "https://..."} className={field} />
          </div>
        </L>
        <L label="النظام"><select name="format" defaultValue={initial?.format ?? "single_elim"} className={field}>{T_FORMATS.map((c) => <option key={c} value={c}>{FORMAT_LABELS[c]}</option>)}</select></L>
        <L label="نمط اللاعبين"><select name="mode" defaultValue={initial?.mode ?? 1} className={field}>{T_MODES.map((m) => <option key={m} value={m}>{m === 1 ? "Solo 1v1" : `${m}v${m}`}</option>)}</select></L>
        <L label="الجائزة الكبرى (درهم)"><input name="prize" type="number" min={0} defaultValue={initial?.prizeMad ?? 10000} className={field} /></L>
        <L label="عدد المقاعد"><select name="slots" defaultValue={initial?.slots ?? 16} className={field}>{T_SLOTS.map((s) => <option key={s}>{s}</option>)}</select></L>
        <L label="توزيع الجوائز % (1 / 2 / 3)">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => <input key={i} name={`p${i + 1}`} type="number" min={0} max={100} defaultValue={(initial?.prizeSplit ?? [60, 30, 10])[i]} className={field} />)}
          </div>
        </L>
        <L label="الحالة"><select name="status" defaultValue={initial?.status ?? "pending"} className={field}>{LIFECYCLE_ORDER.map((s) => <option key={s} value={s}>{LIFECYCLE_LABELS[s]}</option>)}</select></L>
        <L label="تاريخ البدء"><input name="startsAt" type="datetime-local" defaultValue={initial?.startsAt?.slice(0, 16) ?? ""} className={field} /></L>
        <L label="صورة الغلاف (Banner)"><input name="bannerUrl" type="url" defaultValue={initial?.bannerUrl ?? ""} className={field} /></L>
        <L label="الصورة المصغرة"><input name="thumbUrl" type="url" defaultValue={initial?.thumbUrl ?? ""} className={field} /></L>
        <L label="رابط Discord"><input name="discordUrl" type="url" defaultValue={initial?.discordUrl ?? ""} className={field} /></L>
        <L label="رابط البث (YouTube/Kick/Twitch)"><input name="streamUrl" type="url" defaultValue={initial?.streamUrl ?? ""} className={field} /></L>
        {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
        <Button type="submit" disabled={busy} className="sm:col-span-2">{busy ? "..." : "حفظ البطولة"}</Button>
      </form>
    </div>
  );
}

function Control({ access, t, refresh, onClose }: { access: string; t: Tournament; refresh: () => void; onClose: () => void }) {
  const setStatus = useServerFn(adminSetTournamentStatus);
  const draw = useServerFn(adminStartDraw);
  const score = useServerFn(adminReportScore);
  const mstate = useServerFn(adminSetMatchState);
  const complete = useServerFn(adminCompleteTournament);
  const del = useServerFn(adminDeleteTournament);
  const ai = useServerFn(adminAiAssist);
  const [msg, setMsg] = useState<string | null>(null);
  const [aiTask, setAiTask] = useState<"seeding" | "dispute" | "accounting" | "insights">("insights");
  const [note, setNote] = useState("");
  const [answer, setAnswer] = useState(t.aiNotes);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (ok) setMsg(ok);
      refresh();
    } catch (e) {
      setMsg(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  const full = t.registered >= t.slots;
  const rounds = roundsOf(t.matches);

  return (
    <section className="space-y-5 rounded-2xl border border-primary/40 bg-card/90 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex-1 font-display text-xl font-black">{t.title}</h3>
        <select value={t.status} disabled={busy} onChange={(e) => run(() => setStatus({ data: { access, id: t.id, status: e.target.value as Lifecycle } }))} className={`${field} w-auto`}>
          {LIFECYCLE_ORDER.map((s) => <option key={s} value={s}>{LIFECYCLE_LABELS[s]}</option>)}
        </select>
        <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
      </div>
      <p className="text-sm text-muted-foreground">المسجلون: {t.registered}/{t.slots} {full ? "— المقاعد مكتملة" : ""}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} variant={full ? "default" : "outline"} onClick={() => run(() => draw({ data: { access, id: t.id, useAi: true } }), "تم إطلاق القرعة")}>
          <Shuffle /> ابدأ القرعة
        </Button>
        <Button disabled={busy || t.matches.length === 0} variant="outline" onClick={() => run(() => complete({ data: { access, id: t.id } }), "تم إنهاء البطولة وحساب الجوائز")}>
          <Trophy /> إنهاء وتتويج
        </Button>
        <Button disabled={busy} variant="destructive" onClick={() => { if (confirm("حذف البطولة؟")) run(async () => { await del({ data: { access, id: t.id } }); onClose(); }); }}>
          <Trash2 /> حذف
        </Button>
      </div>
      {msg ? <p className="text-sm text-primary">{msg}</p> : null}

      {rounds.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {rounds.map((r, i) => (
            <div key={i} className="min-w-56 space-y-2">
              <p className="text-xs font-bold text-muted-foreground">{roundLabel(r.length)}</p>
              {r.map((m) => <MatchRow key={m.id} m={m} busy={busy}
                onScore={(a, b) => run(() => score({ data: { access, id: t.id, matchId: m.id, scoreA: a, scoreB: b } }))}
                onState={(s) => run(() => mstate({ data: { access, id: t.id, matchId: m.id, state: s } }))} />)}
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-border bg-background/50 p-4">
        <p className="flex items-center gap-2 font-bold"><Bot className="size-5 text-primary" /> مساعد الذكاء الاصطناعي</p>
        <div className="flex flex-wrap gap-2">
          {([["seeding", "القرعة"], ["dispute", "النزاعات"], ["accounting", "المحاسبة"], ["insights", "ملخص مباشر"]] as const).map(([k, v]) => (
            <Button key={k} size="sm" variant={aiTask === k ? "default" : "outline"} onClick={() => setAiTask(k)}>{v}</Button>
          ))}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1500} placeholder="تفاصيل النزاع أو ملاحظة (اختياري)" className={`${field} h-auto py-2`} />
        <Button disabled={busy} onClick={() => run(async () => { const r = await ai({ data: { access, id: t.id, task: aiTask, note, save: aiTask === "insights" } }); setAnswer(r.answer); })}>
          {busy ? "..." : "اسأل المساعد"}
        </Button>
        {answer ? <p className="whitespace-pre-wrap text-sm leading-6">{answer}</p> : null}
      </div>
    </section>
  );
}

function MatchRow({ m, busy, onScore, onState }: { m: Match; busy: boolean; onScore: (a: number, b: number) => void; onState: (s: Match["state"]) => void }) {
  const [a, setA] = useState(String(m.scoreA ?? ""));
  const [b, setB] = useState(String(m.scoreB ?? ""));
  const ready = !!m.a && !!m.b;
  return (
    <div className="rounded-lg border border-border bg-background/60 p-2 text-xs">
      <div className="flex items-center gap-1"><span className="flex-1 truncate">{m.a ?? "—"}</span><input value={a} onChange={(e) => setA(e.target.value)} disabled={!ready} className="h-7 w-10 rounded border border-input bg-background text-center" /></div>
      <div className="mt-1 flex items-center gap-1"><span className="flex-1 truncate">{m.b ?? "—"}</span><input value={b} onChange={(e) => setB(e.target.value)} disabled={!ready} className="h-7 w-10 rounded border border-input bg-background text-center" /></div>
      {ready ? (
        <div className="mt-2 flex gap-1">
          <select value={m.state} disabled={busy} onChange={(e) => onState(e.target.value as Match["state"])} className="h-7 flex-1 rounded border border-input bg-background">
            <option value="pending">انتظار</option><option value="live">مباشر</option><option value="break">استراحة</option><option value="finished">انتهت</option>
          </select>
          <Button size="sm" className="h-7" disabled={busy || a === "" || b === ""} onClick={() => onScore(Number(a), Number(b))}>حفظ</Button>
        </div>
      ) : null}
    </div>
  );
}
