import { Entry, Profile } from "./types";
import { EMOTES, MOOD_META, moodBgOf } from "./theme";
import { avatarUrl } from "./avatar";

const FALLBACK: Profile = {
  id: "?",
  name: "?",
  initial: "?",
  color: "#5f6773",
  avatar: avatarUrl("anon"),
};

export function resolvePerson(profiles: Profile[], id: string): Profile {
  return profiles.find((p) => p.id === id) || FALLBACK;
}

/** Relative time for a ms timestamp: "now", "5m ago", "3h ago", "2d ago", … */
export function timeAgo(ms: number, nowMs: number = Date.now()): string {
  const s = Math.max(0, Math.floor((nowMs - ms) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function avg(e: Entry): number {
  if (!e.watches.length) return 0;
  return e.watches.reduce((a, w) => a + w.rating, 0) / e.watches.length;
}

/** Star fill percentages for a 0-5 value (supports halves). */
export function starsForVal(val: number): { pct: number }[] {
  return [1, 2, 3, 4, 5].map((i) => ({
    pct: val >= i ? 100 : val >= i - 0.5 ? 50 : 0,
  }));
}

export interface EmoteVM {
  emoji: string;
  count: number;
  active: boolean;
  bg: string;
  fg: string;
  ring: string;
}

/** Emote chips for an entry. counts already include everyone's toggles; `mine`
 *  drives the active highlight. Optionally limit to the top-N by count. */
export function buildEmotes(e: Entry, acc: string, limit?: number): EmoteVM[] {
  let arr: EmoteVM[] = EMOTES.map((em) => {
    const active = e.mine.includes(em);
    const count = e.emotes[em] || 0;
    return {
      emoji: em,
      count,
      active,
      bg: active ? acc : "#0c0f14",
      fg: active ? "#0a0c0f" : "#9aa3af",
      ring: active ? "none" : "inset 0 0 0 1px rgba(255,255,255,.07)",
    };
  });
  if (limit) arr = [...arr].sort((a, b) => b.count - a.count).slice(0, limit);
  return arr;
}

export { MOOD_META, moodBgOf };
