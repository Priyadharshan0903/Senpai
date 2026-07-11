import { AniMeta } from "./types";

const PAGE_QUERY = `query($s:String){Page(perPage:6){media(search:$s,type:ANIME,isAdult:false){id title{romaji english}startDate{year}episodes genres coverImage{extraLarge large color}popularity}}}`;

interface AniListMedia {
  id: number;
  title?: { romaji?: string; english?: string };
  startDate?: { year?: number };
  episodes?: number;
  genres?: string[];
  coverImage?: { extraLarge?: string; large?: string; color?: string };
  popularity?: number;
}

function toMeta(m: AniListMedia): AniMeta & { anilistId: number } {
  const ci = m.coverImage || {};
  return {
    anilistId: m.id,
    cover: ci.extraLarge || ci.large || "",
    color: ci.color || "",
    year: m.startDate?.year ? String(m.startDate.year) : "",
    ep: m.episodes ? m.episodes + " eps" : "",
    genres: (m.genres || []).slice(0, 3),
    romaji: m.title?.english || m.title?.romaji || "",
  };
}

/** AniList page search — returns up to 6 candidates, most popular first. */
async function searchAniList(q: string): Promise<(AniMeta & { anilistId: number })[]> {
  const r = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: PAGE_QUERY, variables: { s: q } }),
    next: { revalidate: 60 * 60 },
  });
  if (!r.ok) throw new Error("anilist error " + r.status);
  const j = await r.json();
  const media: AniListMedia[] = j?.data?.Page?.media || [];
  return media
    .slice()
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .map(toMeta)
    .filter((m) => m.romaji);
}

/**
 * Kitsu typo-rescue: Kitsu's full-text search is fuzzy (handles missing
 * letters and misspellings, e.g. "Insomniac after school" → "Kimi wa Houkago
 * Insomnia"). We only take back candidate TITLES, then re-query AniList with
 * them so covers/metadata stay consistent from one source.
 */
async function kitsuTitles(q: string): Promise<string[]> {
  const r = await fetch(
    "https://kitsu.io/api/edge/anime?filter%5Btext%5D=" +
      encodeURIComponent(q) +
      "&page%5Blimit%5D=3",
    { next: { revalidate: 60 * 60 } }
  );
  if (!r.ok) return [];
  const j = await r.json();
  const titles: string[] = [];
  for (const a of j?.data || []) {
    const at = a?.attributes;
    for (const t of [at?.titles?.en, at?.titles?.en_jp, at?.canonicalTitle]) {
      if (t && !titles.includes(t)) titles.push(t);
    }
  }
  return titles;
}

/**
 * Typo-tolerant candidate search:
 *  1. AniList directly (exact-ish match, rich metadata).
 *  2. If nothing: Kitsu fuzzy → canonical titles → AniList again.
 * Returns up to 6 candidates; empty array = truly nothing found.
 */
export async function searchCandidates(q: string): Promise<(AniMeta & { anilistId: number })[]> {
  let direct: (AniMeta & { anilistId: number })[] = [];
  try {
    direct = await searchAniList(q);
  } catch {
    // network/rate-limit — fall through to Kitsu path
  }
  if (direct.length > 0) return direct;

  try {
    const titles = await kitsuTitles(q);
    const seen = new Set<number>();
    const rescued: (AniMeta & { anilistId: number })[] = [];
    for (const t of titles.slice(0, 2)) {
      try {
        for (const m of await searchAniList(t)) {
          if (!seen.has(m.anilistId)) {
            seen.add(m.anilistId);
            rescued.push(m);
          }
        }
      } catch {
        // skip this title
      }
      if (rescued.length >= 6) break;
    }
    return rescued.slice(0, 6);
  } catch {
    return [];
  }
}

/** Single best match — kept for cover hydration and simple callers. */
export async function fetchMeta(title: string): Promise<AniMeta | null> {
  const c = await searchCandidates(title);
  return c[0] || null;
}
