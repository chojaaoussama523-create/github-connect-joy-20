export type ContentStatus = "published" | "draft" | "ongoing" | "finished";

export type MarketItem = {
  id: string;
  tag: string;
  title: string;
  description: string;
  status: ContentStatus;
  featured: boolean;
};

export type TournamentItem = {
  id: string;
  tag: string;
  title: string;
  description: string;
  status: ContentStatus;
  featured: boolean;
};

export const MARKET_STATS = [
  { value: "FEATURED", label: "COLLECTION" },
  { value: "PREMIUM", label: "GAMING GEAR" },
  { value: "GM7", label: "EXCLUSIVE" },
  { value: "24/7", label: "MARKET ACCESS" },
] as const;

export const TOURNAMENT_STATS = [
  { value: "UPCOMING", label: "CHAMPIONSHIPS" },
  { value: "ONGOING", label: "LIVE ARENA" },
  { value: "PLAYERS", label: "COMPETE" },
  { value: "TEAMS", label: "CHALLENGE" },
] as const;

export const MARKET_ITEMS: MarketItem[] = [
  {
    id: "gm7-elite-gear",
    tag: "FEATURED",
    title: "GM7 ELITE GEAR",
    description: "عتاد احترافي مختار بعناية لمجتمع GM7 بعرض فاخر.",
    status: "published",
    featured: true,
  },
  {
    id: "gm7-accessories",
    tag: "NEW DROP",
    title: "GM7 ACCESSORIES",
    description: "إكسسوارات حصرية بتشكيلات متجددة وبطاقات عرض سينمائية.",
    status: "published",
    featured: false,
  },
  {
    id: "gaming-essentials",
    tag: "EXCLUSIVE",
    title: "GAMING ESSENTIALS",
    description: "مستلزمات الألعاب الأساسية في واجهة متجر راقية.",
    status: "draft",
    featured: false,
  },
];

export const TOURNAMENT_ITEMS: TournamentItem[] = [
  {
    id: "gm7-championship",
    tag: "UPCOMING",
    title: "GM7 CHAMPIONSHIP",
    description: "بطولة النخبة مع تفاصيل اللعبة والجوائز والمنطقة والتسجيل.",
    status: "published",
    featured: true,
  },
  {
    id: "gm7-arena-series",
    tag: "ONGOING",
    title: "GM7 ARENA SERIES",
    description: "سلسلة مباريات مباشرة بحالة حيّة وعدادات وفرق ولاعبين.",
    status: "ongoing",
    featured: false,
  },
  {
    id: "gm7-community-cup",
    tag: "GRAND FINAL",
    title: "GM7 COMMUNITY CUP",
    description: "كأس المجتمع بقوانين واضحة وإدارة تسجيلات وفرق.",
    status: "draft",
    featured: false,
  },
];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  published: "منشور",
  draft: "مسودة",
  ongoing: "جارٍ",
  finished: "منتهٍ",
};
