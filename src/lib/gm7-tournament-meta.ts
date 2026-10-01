export type Lifecycle = "pending" | "in_progress" | "active" | "completed" | "cancelled";

export const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  pending: "قيد الإعداد",
  in_progress: "التسجيل مفتوح",
  active: "جارية الآن",
  completed: "انتهت",
  cancelled: "ملغاة",
};

export const LIFECYCLE_ORDER: Lifecycle[] = ["pending", "in_progress", "active", "completed", "cancelled"];

export const T_CATEGORIES = [
  "COMBAT",
  "FPS",
  "BATTLE ROYALE",
  "SPORTS",
  "RPG",
  "MOBA",
  "RACING",
  "STRATEGY",
  "OTHER",
] as const;
export type TCategory = (typeof T_CATEGORIES)[number];

export const T_PLATFORMS = ["MOBILE", "PS5", "PC", "XBOX", "CROSS-PLAY"] as const;
export type TPlatform = (typeof T_PLATFORMS)[number];

export const T_FORMATS = ["groups_playoffs", "single_elim", "double_elim"] as const;
export type TFormat = (typeof T_FORMATS)[number];
export const FORMAT_LABELS: Record<TFormat, string> = {
  groups_playoffs: "مجموعات + بلاي أوف",
  single_elim: "خروج المغلوب (مرة)",
  double_elim: "خروج المغلوب المزدوج",
};

export const T_MODES = [1, 2, 3, 4, 5] as const;
export const T_SLOTS = [8, 16, 32, 64, 128] as const;
export const DEFAULT_SPLIT = [60, 30, 10];

export const REG_STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/live/"))
        return `https://www.youtube.com/embed/${u.pathname.split("/").pop()}`;
    }
    if (u.hostname.includes("kick.com")) return `https://player.kick.com${u.pathname}`;
    if (u.hostname.includes("twitch.tv"))
      return `https://player.twitch.tv/?channel=${u.pathname.replace("/", "")}&parent=${typeof window === "undefined" ? "lovable.app" : window.location.hostname}`;
    if (u.hostname.includes("discord")) return null;
    return url;
  } catch {
    return null;
  }
}
