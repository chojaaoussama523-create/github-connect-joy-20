/** Curated official game logos (high-res / transparent). Falls back to an initials badge on error. */
const LOGOS: Record<string, string> = {
  valorant: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg",
  fortnite: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Fortnite_F_lettermark_logo.png",
  "league of legends": "https://upload.wikimedia.org/wikipedia/commons/d/dd/League_of_Legends_2019_vector.svg",
  "rocket league": "https://upload.wikimedia.org/wikipedia/commons/b/bd/Rocket_League_coverart.jpg",
  "counter-strike 2": "https://upload.wikimedia.org/wikipedia/commons/9/96/Counter-Strike_2.svg",
  "dota 2": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Dota_2_Logo.svg",
  minecraft: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Minecraft_logo.svg",
};

export function officialGameLogo(gameName: string): string | null {
  const key = gameName.trim().toLowerCase();
  if (LOGOS[key]) return LOGOS[key]!;
  const partial = Object.keys(LOGOS).find((k) => key.includes(k) || k.includes(key));
  return partial ? LOGOS[partial]! : null;
}

export function initialsOf(name: string): string {
  const letters = name
    .replace(/[^A-Za-z0-9\u0600-\u06FF ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return letters || "GM";
}
