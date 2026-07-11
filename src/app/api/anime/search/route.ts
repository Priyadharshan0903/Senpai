import { NextRequest, NextResponse } from "next/server";
import { searchCandidates } from "@/lib/anilist";
import { darken, artPairForTitle } from "@/lib/theme";

// GET /api/anime/search?q=frieren — typo-tolerant candidate search
// (AniList → Kitsu fuzzy rescue → AniList). Returns the best match plus the
// full candidate list so the client can offer "did you mean" picks.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });

  const results = await searchCandidates(q);

  const candidates = results.map((m) => {
    const c1 = m.color || artPairForTitle(m.romaji || q)[0];
    return {
      anilistId: m.anilistId,
      title: m.romaji,
      cover: m.cover || "",
      c1,
      c2: m.color ? darken(m.color) : "#141821",
      year: m.year,
      ep: m.ep,
      genres: m.genres,
    };
  });

  if (candidates.length > 0) {
    const best = candidates[0];
    return NextResponse.json({
      found: true,
      ...best,
      matchLabel: best.cover ? "ARTWORK FOUND" : "NO MATCH — DROP YOUR OWN",
      candidates,
    });
  }

  // No match anywhere — deterministic gradient fallback, like the prototype.
  const [c1, c2] = artPairForTitle(q);
  return NextResponse.json({
    found: true,
    anilistId: null,
    title: q,
    cover: "",
    c1,
    c2,
    year: "",
    ep: "",
    genres: [],
    matchLabel: "NO MATCH — DROP YOUR OWN",
    candidates: [],
  });
}
