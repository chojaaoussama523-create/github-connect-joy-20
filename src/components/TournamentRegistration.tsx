import { CheckCircle2, Radio } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { checkInRegistration, getMyRegistrations, submitRegistration, type RegRow } from "@/lib/gm7-registrations.functions";
import { GAMES, PLATFORMS, TEAM_MODES, type Platform, type TeamMode } from "@/lib/gm7-tournaments";

const KEY = "gm7-my-registration-codes";

const schema = z.object({
  team: z.string().trim().min(2, "اسم الفريق/اللاعب قصير").max(40),
  captain: z.string().trim().min(2, "اسم الكابتن مطلوب").max(40),
  whatsapp: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/, "رقم واتساب غير صالح"),
  discord: z.string().trim().max(40),
  city: z.string().trim().min(2, "المدينة مطلوبة").max(40),
  platformId: z.string().trim().min(2, "معرّف المنصة مطلوب").max(40),
  roster: z.array(z.string().trim().min(2, "أكمل أسماء اللاعبين").max(40)),
});

const DEMO_MATCHES = [
  { a: "LMLA7 Wolves", b: "Atlas Esports", game: "EA SPORTS FC 26", stage: "ربع النهائي", score: "2 - 1" },
  { a: "Casa Kings", b: "Rabat Ronin", game: "VALORANT", stage: "نصف النهائي", score: "9 - 7" },
  { a: "Sensei Squad", b: "Agadir Storm", game: "TEKKEN 8", stage: "دور 16", score: "1 - 1" },
];

const input = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground";

export function TournamentRegistration() {
  const submitFn = useServerFn(submitRegistration);
  const mineFn = useServerFn(getMyRegistrations);
  const checkInFn = useServerFn(checkInRegistration);
  const [list, setList] = useState<RegRow[]>([]);
  const [mode, setMode] = useState<TeamMode>(1);
  const [platform, setPlatform] = useState<Platform>("PS5");
  const [gameId, setGameId] = useState("");
  const [form, setForm] = useState({ team: "", captain: "", whatsapp: "", discord: "", city: "", platformId: "", sub: "" });
  const [roster, setRoster] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function codes(): string[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    const c = codes();
    if (c.length) mineFn({ data: { codes: c } }).then(setList).catch(() => undefined);
  }, [mineFn]);

  const platformGames = GAMES.filter((g) => g.platforms.includes(platform));
  const extra = mode - 1;
  const rosterSlots = Array.from({ length: extra }, (_, i) => roster[i] ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, roster: rosterSlots });
    const errs = parsed.success ? [] : parsed.error.issues.map((i) => i.message);
    if (!gameId) errs.push("اختر اللعبة");
    if (!agree) errs.push("يجب الموافقة على إقرار النزاهة");
    setErrors([...new Set(errs)]);
    if (errs.length || !parsed.success) return;
    setBusy(true);
    try {
      const row = await submitFn({
        data: { ...parsed.data, sub: form.sub.trim(), platform, gameId, mode },
      });
      localStorage.setItem(KEY, JSON.stringify([...codes(), row.code]));
      setList((l) => [...l, row]);
    } catch {
      setErrors(["تعذر إرسال التسجيل، حاول مجدداً."]);
      return;
    } finally {
      setBusy(false);
    }
    setForm({ team: "", captain: "", whatsapp: "", discord: "", city: "", platformId: "", sub: "" });
    setRoster([]);
    setAgree(false);
    setDone(true);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setDone(false);
  };

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-destructive" aria-hidden="true" />
          <h2 className="font-display text-lg font-black text-foreground">مركز المباريات</h2>
          <span className="rounded bg-muted px-2 text-[10px] text-muted-foreground">عرض تجريبي</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {DEMO_MATCHES.map((m) => (
            <div key={m.a} className="rounded-lg border border-border bg-background/60 p-4">
              <p className="text-xs text-primary">{m.game} · {m.stage}</p>
              <div className="mt-2 flex items-center justify-between gap-2 text-sm font-bold text-foreground">
                <span className="truncate">{m.a}</span>
                <span className="font-display text-lg text-primary">{m.score}</span>
                <span className="truncate">{m.b}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
        <h2 className="font-display text-lg font-black text-foreground">التسجيل في البطولة</h2>
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-4" noValidate>
          <div className="flex flex-wrap gap-2">
            {TEAM_MODES.map((m) => (
              <Button key={m} type="button" size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
                {m}v{m}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input className={input} placeholder={mode === 1 ? "اسم اللاعب" : "اسم الفريق"} value={form.team} onChange={set("team")} maxLength={40} />
            <input className={input} placeholder="اسم الكابتن" value={form.captain} onChange={set("captain")} maxLength={40} />
            <input className={input} placeholder="رقم واتساب" inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} maxLength={16} />
            <input className={input} placeholder="معرّف ديسكورد (اختياري)" value={form.discord} onChange={set("discord")} maxLength={40} />
            <input className={input} placeholder="المدينة" value={form.city} onChange={set("city")} maxLength={40} />
            <select className={input} value={platform} onChange={(e) => { setPlatform(e.target.value as Platform); setGameId(""); }}>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className={input} value={gameId} onChange={(e) => setGameId(e.target.value)}>
              <option value="">اختر اللعبة ({platformGames.length})</option>
              {platformGames.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input className={input} placeholder="معرّف المنصة (PSN / EA / Riot / Steam)" value={form.platformId} onChange={set("platformId")} maxLength={40} />
          </div>
          {extra > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rosterSlots.map((v, i) => (
                <input key={i} className={input} placeholder={`اللاعب ${i + 2}`} value={v} maxLength={40}
                  onChange={(e) => setRoster(() => rosterSlots.map((x, j) => (j === i ? e.target.value : x)))} />
              ))}
              <input className={input} placeholder="اللاعب الاحتياطي (اختياري)" value={form.sub} onChange={set("sub")} maxLength={40} />
            </div>
          ) : null}
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
            أقر بالالتزام بقوانين النزاهة، وتأكيد الحضور (Check-In) قبل 30 دقيقة من المباراة.
          </label>
          {errors.length ? (
            <ul className="space-y-1 text-sm text-destructive">{errors.map((e) => <li key={e}>• {e}</li>)}</ul>
          ) : null}
          {done ? <p className="text-sm text-primary">تم التسجيل بنجاح ✅ — لا تنس تأكيد الحضور أدناه.</p> : null}
          <Button type="submit" size="lg" disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال التسجيل"}</Button>
        </form>
      </section>

      {list.length ? (
        <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
          <h2 className="font-display text-lg font-black text-foreground">تسجيلاتي وتأكيد الحضور</h2>
          <ul className="mt-4 space-y-2">
            {list.map((r) => (
              <li key={r.code} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/60 p-3 text-sm">
                <span className="text-foreground">
                  <b>{r.team}</b> · {GAMES.find((g) => g.id === r.gameId)?.name} · {r.platform} · {r.mode}v{r.mode}
                  <span className="mr-2 text-xs text-muted-foreground">{r.code}</span>
                </span>
                {r.status === "rejected" ? (
                  <span className="text-destructive">مرفوض</span>
                ) : r.status === "waitlist" ? (
                  <span className="text-muted-foreground">قائمة انتظار</span>
                ) : r.status === "checked-in" ? (
                  <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> تم تأكيد الحضور</span>
                ) : (
                  <Button size="sm" onClick={() => { setList((l) => l.map((x) => (x.code === r.code ? { ...x, status: "checked-in" } : x))); void checkInFn({ data: { code: r.code } }); }}>Check-In</Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
