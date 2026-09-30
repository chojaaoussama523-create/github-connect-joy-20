import { Plus, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { GameCatalog, GameLogo } from "@/components/GameCatalog";
import { Button } from "@/components/ui/button";
import {
  BRACKET_SIZES,
  GAMES,
  PLATFORMS,
  PRIZE_SPLIT,
  TEAM_MODES,
  type BracketSize,
  type Format,
  type Game,
  type Platform,
  type TeamMode,
} from "@/lib/gm7-tournaments";

type Slot = string | null;

function roundName(matches: number): string {
  if (matches === 1) return "النهائي";
  if (matches === 2) return "نصف النهائي";
  if (matches === 4) return "ربع النهائي";
  return `دور ${matches * 2}`;
}

export function TournamentEngine() {
  const [games, setGames] = useState<Game[]>(GAMES);
  const [platform, setPlatform] = useState<Platform>("PC");
  const [newGame, setNewGame] = useState("");
  const [game, setGame] = useState<Game>(GAMES[0]!);
  const [mode, setMode] = useState<TeamMode>(1);
  const [format, setFormat] = useState<Format>("knockout");
  const [size, setSize] = useState<BracketSize>(8);
  const [prize, setPrize] = useState(10000);
  const [teams, setTeams] = useState<string[]>(() => Array.from({ length: 8 }, (_, i) => `فريق ${i + 1}`));
  const [winners, setWinners] = useState<Slot[][]>([]);
  const [third, setThird] = useState<Slot>(null);

  function resize(next: BracketSize) {
    setSize(next);
    setTeams(Array.from({ length: next }, (_, i) => teams[i] ?? `فريق ${i + 1}`));
    setWinners([]);
    setThird(null);
  }

  const rounds = useMemo(() => {
    const result: Slot[][] = [teams];
    let current: Slot[] = teams;
    let r = 0;
    while (current.length > 1) {
      const next: Slot[] = Array.from({ length: current.length / 2 }, (_, i) => winners[r]?.[i] ?? null);
      result.push(next);
      current = next;
      r += 1;
    }
    return result;
  }, [teams, winners]);

  function pick(round: number, match: number, name: Slot) {
    if (!name) return;
    setWinners((prev) => {
      const copy = prev.slice(0, round + 1).map((row) => [...row]);
      while (copy.length <= round) copy.push([]);
      copy[round]![match] = name;
      return copy;
    });
    setThird(null);
  }

  const champion = rounds[rounds.length - 1]?.[0] ?? null;
  const finalists = rounds[rounds.length - 2] ?? [];
  const runnerUp = champion ? (finalists.find((t) => t !== champion) ?? null) : null;
  const semis = rounds.length >= 3 ? rounds[rounds.length - 3]! : [];
  const semiLosers = semis.length === 4 ? [0, 1].map((m) => {
    const w = finalists[m];
    const pair = [semis[m * 2], semis[m * 2 + 1]];
    return w ? (pair.find((t) => t !== w) ?? null) : null;
  }) : [];
  const podium = [champion, runnerUp, size === 2 ? null : third];

  return (
    <div className="space-y-8">
      <GameCatalog games={games} selectedId={game.id} onSelect={setGame} />
      <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
        <h2 className="font-display text-lg font-black text-foreground">إضافة لعبة جديدة</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={newGame} onChange={(e) => setNewGame(e.target.value)} placeholder="اسم لعبة جديدة" className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-foreground" />
          <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="h-10 rounded-lg border border-input bg-background px-3 text-foreground">
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={!newGame.trim()}
            onClick={() => {
              const name = newGame.trim();
              setGames((g) => [...g, { id: `custom-${g.length}`, name, genre: "Custom", category: "other", platforms: [platform], status: "ready" }]);
              setNewGame("");
            }}
          >
            <Plus aria-hidden="true" /> إضافة
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <GameLogo name={game.name} />
          <h2 className="font-display text-lg font-black text-foreground">إعداد البطولة — {game.name}</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="نمط المنافسة">
            <div className="flex flex-wrap gap-1">
              {TEAM_MODES.map((m) => (
                <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>{m}v{m}</Button>
              ))}
            </div>
          </Field>
          <Field label="نظام المسابقة">
            <div className="flex gap-1">
              <Button size="sm" variant={format === "knockout" ? "default" : "outline"} onClick={() => setFormat("knockout")}>إقصائيات</Button>
              <Button size="sm" variant={format === "groups" ? "default" : "outline"} onClick={() => setFormat("groups")}>مجموعات</Button>
            </div>
          </Field>
          <Field label="عدد المشاركين">
            <div className="flex flex-wrap gap-1">
              {BRACKET_SIZES.map((s) => (
                <Button key={s} size="sm" variant={size === s ? "default" : "outline"} onClick={() => resize(s)}>{s}</Button>
              ))}
            </div>
          </Field>
          <Field label="مجموع الجوائز (درهم)">
            <input type="number" min={0} value={prize} onChange={(e) => setPrize(Math.max(0, Number(e.target.value)))} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-foreground" />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">كل مشارك: {mode === 1 ? "لاعب واحد" : `${mode} لاعبين + احتياطي`}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {teams.map((t, i) => (
            <input
              key={i}
              value={t}
              aria-label={`المشارك ${i + 1}`}
              onChange={(e) => setTeams((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            />
          ))}
        </div>
      </section>

      {format === "groups" ? (
        <GroupsView teams={teams} />
      ) : (
        <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
          <h2 className="font-display text-lg font-black text-foreground">شجرة الإقصائيات</h2>
          <p className="mt-1 text-xs text-muted-foreground">اضغط على الفائز في كل مباراة لينتقل للدور التالي.</p>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
            {rounds.slice(0, -1).map((participants, r) => (
              <div key={r} className="flex min-w-44 flex-col justify-around gap-3">
                <p className="text-center text-xs font-bold text-primary">{roundName(participants.length / 2)}</p>
                {Array.from({ length: participants.length / 2 }, (_, m) => {
                  const a = participants[m * 2] ?? null;
                  const b = participants[m * 2 + 1] ?? null;
                  const w = winners[r]?.[m] ?? null;
                  return (
                    <div key={m} className="overflow-hidden rounded-md border border-border">
                      {[a, b].map((t, k) => (
                        <button
                          key={k}
                          type="button"
                          disabled={!t || !a || !b}
                          onClick={() => pick(r, m, t)}
                          className={`block w-full truncate px-3 py-2 text-right text-sm ${w && w === t ? "bg-primary/20 font-bold text-foreground" : "bg-background/60 text-muted-foreground"} ${k === 0 ? "border-b border-border" : ""}`}
                        >
                          {t ?? "—"}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex min-w-36 flex-col items-center justify-center gap-2">
              <Trophy className="h-8 w-8 text-primary" aria-hidden="true" />
              <p className="text-center text-sm font-black text-foreground">{champion ?? "البطل"}</p>
            </div>
          </div>
          {semiLosers.length === 2 && semiLosers[0] && semiLosers[1] ? (
            <div className="mt-4">
              <p className="text-xs font-bold text-primary">مباراة المركز الثالث</p>
              <div className="mt-2 flex gap-2">
                {semiLosers.map((t) => (
                  <Button key={t} size="sm" variant={third === t ? "default" : "outline"} onClick={() => setThird(t)}>{t}</Button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
        <h2 className="font-display text-lg font-black text-foreground">منصة التتويج</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["🥇 المركز الأول", "🥈 المركز الثاني", "🥉 المركز الثالث"].map((label, i) => (
            <div key={label} className="rounded-lg border border-border bg-background/60 p-4 text-center">
              <p className="text-sm font-bold text-foreground">{label}</p>
              <p className="mt-2 font-display text-lg font-black text-primary">{podium[i] ?? "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{Math.round(prize * PRIZE_SPLIT[i]!)} درهم ({PRIZE_SPLIT[i]! * 100}%)</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function GroupsView({ teams }: { teams: string[] }) {
  const groupCount = Math.max(1, Math.floor(teams.length / 4));
  const groups = Array.from({ length: groupCount }, (_, g) => teams.filter((_, i) => i % groupCount === g));
  return (
    <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
      <h2 className="font-display text-lg font-black text-foreground">دور المجموعات</h2>
      <p className="mt-1 text-xs text-muted-foreground">فوز 3 نقاط · تعادل 1 · الأول والثاني يتأهلان للإقصائيات.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g, i) => (
          <div key={i} className="rounded-lg border border-border bg-background/60 p-3">
            <p className="text-sm font-black text-primary">المجموعة {String.fromCharCode(65 + i)}</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {g.map((t) => (
                <li key={t} className="flex justify-between"><span className="truncate">{t}</span><span className="text-muted-foreground">0 ن</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
