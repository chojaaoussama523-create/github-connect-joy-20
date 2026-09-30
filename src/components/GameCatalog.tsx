import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  GAME_STATUS_LABELS,
  PLATFORMS,
  type Category,
  type Game,
  type Platform,
} from "@/lib/gm7-tournaments";

const PAGE = 24;

export function GameLogo({ name }: { name: string }) {
  const initials = name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-gradient-to-br from-primary/25 to-accent/20 font-display text-base font-black text-primary shadow-[0_0_18px_-6px_var(--color-primary)]">
      {initials || "GM"}
    </span>
  );
}

type Props = {
  games: Game[];
  selectedId?: string;
  onSelect?: (g: Game) => void;
  title?: string;
};

export function GameCatalog({ games, selectedId, onSelect, title = "مكتبة ألعاب البطولات" }: Props) {
  const [platform, setPlatform] = useState<Platform | "ALL">("ALL");
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(
    () =>
      games.filter(
        (g) =>
          (platform === "ALL" || g.platforms.includes(platform)) &&
          (category === "ALL" || g.category === category) &&
          g.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [games, platform, category, query],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: games.length };
    for (const p of PLATFORMS) c[p] = games.filter((g) => g.platforms.includes(p)).length;
    return c;
  }, [games]);

  return (
    <section className="rounded-xl border border-border bg-card/80 p-5 backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-lg font-black text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">
          {games.length} لعبة فريدة · {filtered.length} نتيجة
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["ALL", ...PLATFORMS] as const).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={platform === p ? "default" : "outline"}
            onClick={() => {
              setPlatform(p);
              setLimit(PAGE);
            }}
          >
            {p === "ALL" ? "كل الأجهزة" : p} <span className="opacity-70">({counts[p]})</span>
          </Button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["ALL", ...CATEGORIES] as const).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "secondary" : "ghost"}
            onClick={() => {
              setCategory(c);
              setLimit(PAGE);
            }}
          >
            {c === "ALL" ? "كل الفئات" : CATEGORY_LABELS[c]}
          </Button>
        ))}
      </div>

      <label className="relative mt-3 block">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="ابحث عن لعبة"
          className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-foreground"
        />
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, limit).map((g) => {
          const active = selectedId === g.id;
          const body = (
            <div className="flex items-center gap-3">
              <GameLogo name={g.name} />
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-bold text-foreground">{g.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {CATEGORY_LABELS[g.category]} · {g.genre}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {g.platforms.map((p) => (
                    <span key={p} className="rounded bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                      {p}
                    </span>
                  ))}
                  <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
                    {GAME_STATUS_LABELS[g.status]}
                  </span>
                </div>
              </div>
            </div>
          );
          const cls = `rounded-lg border p-3 transition ${active ? "border-primary bg-primary/10" : "border-border bg-background/60 hover:border-primary/50"}`;
          return onSelect ? (
            <button key={g.id} type="button" onClick={() => onSelect(g)} className={cls}>
              {body}
            </button>
          ) : (
            <div key={g.id} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">لا توجد ألعاب مطابقة.</p> : null}
      {filtered.length > limit ? (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE * 2)}>
            عرض المزيد ({filtered.length - limit})
          </Button>
        </div>
      ) : null}
    </section>
  );
}
