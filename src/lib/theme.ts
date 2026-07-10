// Design tokens ported 1:1 from Canon.dc.html

export const ACCENT = "#5b8cc9"; // props.accent default from the design's $preview

export const MOOD_META: Record<string, string> = {
  Peak: "#f5b942",
  Hyped: "#ff6f61",
  Comfort: "#57c99a",
  Devastating: "#5b8cc9",
  Chills: "#3fbfd1",
  Mid: "#8a929e",
};

export const PLATFORM_META: Record<string, string> = {
  Crunchyroll: "#f47521",
  Netflix: "#e50914",
  "Disney+ / Hotstar": "#1f80e0",
  "Local / Other": "#7c8698",
};

export const EMOTES = ["\u{1F525}", "\u{1F62D}", "\u{1F92F}", "\u{1F451}", "\u{1FAF6}"];

export const MOOD_LIST = ["Peak", "Hyped", "Comfort", "Devastating", "Chills", "Mid"];

export const PLATFORM_LIST = [
  "Crunchyroll",
  "Netflix",
  "Disney+ / Hotstar",
  "Local / Other",
];

export const GENRE_LIST = [
  "Action",
  "Fantasy",
  "Drama",
  "Comedy",
  "Sci-Fi",
  "Romance",
  "Horror",
  "Music",
  "Slice of Life",
  "Supernatural",
  "Thriller",
  "Adventure",
];

export const GENRE_FILTERS = ["All", "Action", "Fantasy", "Drama", "Comedy", "Sci-Fi"];

export const ART_PAIRS: [string, string][] = [
  ["#3a8f86", "#1e3a52"],
  ["#e6b422", "#b23a2e"],
  ["#c0532a", "#2a1512"],
  ["#2ea3b0", "#2a3550"],
  ["#4a6a78", "#1e2428"],
  ["#e07a6a", "#e0a94a"],
  ["#5b8cc9", "#22304a"],
  ["#57c99a", "#1f3f38"],
  ["#d98b3a", "#5a2e1e"],
];

/** Darken a hex color to 45% brightness — matches the prototype's darken(). */
export function darken(hex: string): string {
  if (!/^#([0-9a-f]{6})$/i.test(hex || "")) return "#141821";
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.45);
  const g = Math.round(((n >> 8) & 255) * 0.45);
  const b = Math.round((n & 255) * 0.45);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/** Normalize a title for dup matching — matches the prototype's norm(). */
export function norm(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Deterministic art pair from a title, matching the prototype's char-sum hash. */
export function artPairForTitle(title: string): [string, string] {
  const sum = [...title].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return ART_PAIRS[sum % ART_PAIRS.length];
}

export function moodBgOf(c: string): string {
  return c + "22";
}

export function rewatchLabel(n: number): string {
  return n === 1 ? "Rewatched once" : "Rewatched " + n + "×";
}

export const CREW_COLORS: Record<string, string> = {
  Ravi: "#6fcf97",
  Mei: "#ff6f61",
  Kenji: "#5b8cc9",
  Aisha: "#e08a9a",
  Theo: "#3fbfd1",
  Yuki: "#e0a54b",
};
