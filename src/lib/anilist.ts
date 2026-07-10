import { AniMeta } from "./types";

const ANILIST_QUERY = `query($s:String){Media(search:$s,type:ANIME){title{romaji english}startDate{year}episodes genres coverImage{extraLarge large color}}}`;

/** Primary source: AniList GraphQL — same query the prototype uses. */
async function fetchAniList(title: string): Promise<AniMeta | null> {
  const r = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { s: title } }),
    // AniList is fine to cache briefly on the server.
    next: { revalidate: 60 * 60 },
  });
  if (!r.ok) throw new Error("anilist error " + r.status);
  const j = await r.json();
  const m = j?.data?.Media;
  if (!m) return null;
  const ci = m.coverImage || {};
  return {
    cover: ci.extraLarge || ci.large || "",
    color: ci.color || "",
    year: m.startDate?.year ? String(m.startDate.year) : "",
    ep: m.episodes ? m.episodes + " eps" : "",
    genres: (m.genres || []).slice(0, 3),
    romaji: m.title?.english || m.title?.romaji || title,
  };
}

/** Fallback source: Jikan (MyAnimeList) if AniList is down or rate-limited. */
async function fetchJikan(title: string): Promise<AniMeta | null> {
  const r = await fetch(
    "https://api.jikan.moe/v4/anime?limit=1&q=" + encodeURIComponent(title),
    { next: { revalidate: 60 * 60 } }
  );
  if (!r.ok) return null;
  const j = await r.json();
  const m = j?.data?.[0];
  if (!m) return null;
  return {
    cover: m.images?.jpg?.large_image_url || m.images?.jpg?.image_url || "",
    color: "",
    year: m.year ? String(m.year) : m.aired?.prop?.from?.year ? String(m.aired.prop.from.year) : "",
    ep: m.episodes ? m.episodes + " eps" : "",
    genres: (m.genres || []).slice(0, 3).map((g: { name: string }) => g.name),
    romaji: m.title_english || m.title || title,
  };
}

/** Fetch anime metadata, AniList first then Jikan. Returns null if nothing found. */
export async function fetchMeta(title: string): Promise<AniMeta | null> {
  try {
    const a = await fetchAniList(title);
    if (a) return a;
  } catch {
    // fall through to Jikan
  }
  try {
    return await fetchJikan(title);
  } catch {
    return null;
  }
}
