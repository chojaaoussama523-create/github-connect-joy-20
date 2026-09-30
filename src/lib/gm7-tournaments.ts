import catalog from "@/data/gm7-games.json";

export type Platform = "PS5" | "PC" | "XBOX" | "SWITCH" | "MOBILE";
export type GameStatus = "live" | "open" | "ready";
export type TeamMode = 1 | 2 | 3 | 4 | 5;
export type Format = "knockout" | "groups";
export type BracketSize = 2 | 4 | 8 | 16 | 32;
export type Category =
  | "fighting"
  | "shooter"
  | "battle-royale"
  | "sports"
  | "strategy"
  | "racing"
  | "cards"
  | "other";

export type Game = {
  id: string;
  name: string;
  genre: string;
  category: Category;
  platforms: Platform[];
  status: GameStatus;
  logoSource?: string | undefined;
};

export const PLATFORMS: Platform[] = ["PS5", "PC", "XBOX", "SWITCH", "MOBILE"];
export const TEAM_MODES: TeamMode[] = [1, 2, 3, 4, 5];
export const BRACKET_SIZES: BracketSize[] = [32, 16, 8, 4, 2];

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  live: "بطولة نشطة",
  open: "مفتوحة للتسجيل",
  ready: "جاهزة للتنظيم",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  fighting: "قتال",
  shooter: "تصويب",
  "battle-royale": "باتل رويال",
  sports: "رياضة",
  strategy: "استراتيجية وموبا",
  racing: "سباقات",
  cards: "بطاقات ولوحية",
  other: "أخرى",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export function categoryOf(genre: string): Category {
  const g = genre.toLowerCase();
  if (g.includes("battle royale")) return "battle-royale";
  if (g.includes("fighting") || g.includes("brawler") || g.includes("combat") || g.includes("wrestling"))
    return "fighting";
  if (g.includes("fps") || g.includes("shooter") || g.includes("tps")) return "shooter";
  if (g.includes("racing")) return "racing";
  if (g.includes("moba") || g.includes("rts") || g.includes("strategy") || g.includes("auto battler") || g.includes("chess"))
    return "strategy";
  if (g.includes("card") || g.includes("board")) return "cards";
  if (
    ["football", "sports", "basketball", "cricket", "baseball", "tennis", "golf", "hockey"].some((k) => g.includes(k))
  )
    return "sports";
  return "other";
}

type RawGame = { id: string; name: string; genre: string; platforms: string[]; status: string; logoSource?: string };

export const GAMES: Game[] = (catalog as RawGame[]).map((g) => ({
  id: g.id,
  name: g.name,
  genre: g.genre,
  category: categoryOf(g.genre),
  platforms: g.platforms.filter((p): p is Platform => (PLATFORMS as string[]).includes(p)),
  status: g.status === "open" ? "open" : "ready",
  logoSource: g.logoSource,
}));

export const PRIZE_SPLIT = [0.6, 0.25, 0.15] as const;
