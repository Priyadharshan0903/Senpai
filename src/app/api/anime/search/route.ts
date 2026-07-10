import { NextRequest, NextResponse } from "next/server";
import { fetchMeta } from "@/lib/anilist";
import { darken, artPairForTitle } from "@/lib/theme";

// GET /api/anime/search?q=frieren — proxies AniList (Jikan fallback) and returns
// the normalized art/meta the Add screen needs. Mirrors the prototype's findArt().
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });

  const meta = await fetchMeta(q);
  if (meta) {
    const c1 = meta.color || artPairForTitle(q)[0];
    return NextResponse.json({
      found: true,
      title: meta.romaji || q,
      cover: meta.cover || "",
      c1,
      c2: meta.color ? darken(meta.color) : "#141821",
      year: meta.year,
      ep: meta.ep,
      genres: meta.genres,
      matchLabel: meta.cover ? "ARTWORK FOUND" : "NO MATCH — DROP YOUR OWN",
    });
  }

  // No match — deterministic gradient fallback, exactly like the prototype.
  const [c1, c2] = artPairForTitle(q);
  return NextResponse.json({
    found: true,
    title: q,
    cover: "",
    c1,
    c2,
    year: "",
    ep: "",
    genres: [],
    matchLabel: "NO MATCH — DROP YOUR OWN",
  });
}
