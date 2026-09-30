export function formatMad(n: number) {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(n)} د.م.`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "في الطريق",
  delivered: "تم التسليم",
  paid: "تم القبض",
  cancelled: "ملغى",
};

/** Build an embeddable URL for Kick / YouTube links, or null if not embeddable. */
export function embedUrl(platform: string, url: string, parent?: string): string | null {
  try {
    const u = new URL(url);
    if (platform === "kick") {
      const channel = u.pathname.split("/").filter(Boolean)[0];
      return channel ? `https://player.kick.com/${channel}` : null;
    }
    if (platform === "youtube") {
      let id: string | null = null;
      if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? null;
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? null;
      else id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (platform === "tiktok") {
      const m = u.pathname.match(/video\/(\d+)/);
      return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
    }
    if (platform === "instagram") {
      const m = u.pathname.match(/\/(reel|p)\/([^/]+)/);
      return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null;
    }
  } catch {
    return null;
  }
  void parent;
  return null;
}
