import { NextRequest, NextResponse } from "next/server";
import { asc, desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { profileToClient, parseJson } from "@/db/mappers";
import { timeAgo } from "@/lib/derive";
import { AppData, Entry, WatchlistItem } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/data?me=<profileId> — full app snapshot. `me` marks which emotes the
// viewer reacted with so the client can render the active highlight.
export async function GET(req: NextRequest) {
  try {
    const me = req.nextUrl.searchParams.get("me") || "";
    const db = await getDb();

    const profileRows = await db.select().from(schema.profiles).orderBy(asc(schema.profiles.ord), asc(schema.profiles.createdAt)).all();
    const animeRows = await db.select().from(schema.anime).orderBy(desc(schema.anime.updatedAt)).all();
    const watchRows = await db.select().from(schema.watches).orderBy(asc(schema.watches.id)).all();
    const factRows = await db.select().from(schema.facts).orderBy(asc(schema.facts.at)).all();
    const confirmRows = await db.select().from(schema.factConfirms).all();
    const emoteRows = await db.select().from(schema.emotes).all();
    const favRows = await db.select().from(schema.favs).all();
    const wlRows = await db.select().from(schema.watchlist).orderBy(desc(schema.watchlist.createdAt)).all();

    // group child rows by anime
    const watchesBy: Record<string, typeof watchRows> = {};
    for (const w of watchRows) (watchesBy[w.animeId] ||= []).push(w);

    const confirmsBy: Record<string, string[]> = {};
    for (const c of confirmRows) (confirmsBy[c.factId] ||= []).push(c.userId);

    const factsBy: Record<string, typeof factRows> = {};
    for (const f of factRows) (factsBy[f.animeId] ||= []).push(f);

    const emoteCounts: Record<string, Record<string, number>> = {};
    const mineBy: Record<string, string[]> = {};
    for (const e of emoteRows) {
      (emoteCounts[e.animeId] ||= {})[e.emoji] = (emoteCounts[e.animeId]?.[e.emoji] || 0) + 1;
      if (me && e.userId === me) (mineBy[e.animeId] ||= []).push(e.emoji);
    }

    const favsBy: Record<string, string[]> = {};
    for (const f of favRows) (favsBy[f.animeId] ||= []).push(f.userId);

    const entries: Entry[] = animeRows.map((a) => {
      const base = parseJson<Record<string, number>>(a.emotesBase, {});
      const emotes: Record<string, number> = { ...base };
      for (const [emoji, extra] of Object.entries(emoteCounts[a.id] || {})) {
        emotes[emoji] = (emotes[emoji] || 0) + extra;
      }
      return {
        id: a.id,
        anilistId: a.anilistId,
        title: a.title,
        year: a.year,
        ep: a.ep,
        genres: parseJson<string[]>(a.genres, []),
        c1: a.c1,
        c2: a.c2,
        cover: a.cover,
        time: timeAgo(a.updatedAt),
        emotes,
        mine: mineBy[a.id] || [],
        favs: favsBy[a.id] || [],
        watches: (watchesBy[a.id] || []).map((w) => ({
          user: w.userId,
          rating: w.rating,
          mood: w.mood,
          platform: w.platform,
          reflect: w.reflect,
          momentTitle: w.momentTitle,
          momentWhy: w.momentWhy,
          rewatch: w.rewatch,
        })),
        facts: (factsBy[a.id] || []).map((f) => ({
          id: f.id,
          user: f.userId,
          text: f.text,
          confirms: confirmsBy[f.id] || [],
        })),
        createdAt: new Date(a.createdAt).toISOString(),
      };
    });

    // resolve watchlist items already logged by the crew (anilistId beats title)
    const byNorm: Record<string, string> = {};
    const byAni: Record<number, string> = {};
    for (const a of animeRows) {
      byNorm[a.normTitle] = a.id;
      if (a.anilistId != null) byAni[a.anilistId] = a.id;
    }

    const watchlist: WatchlistItem[] = wlRows.map((w) => ({
      id: w.id,
      user: w.userId,
      title: w.title,
      status: (w.status === "Watching" ? "Watching" : "Plan") as "Watching" | "Plan",
      anilistId: w.anilistId,
      cover: w.cover,
      year: w.year,
      ep: w.ep,
      genres: parseJson<string[]>(w.genres, []),
      c1: w.c1,
      c2: w.c2,
      entryId:
        (w.anilistId != null ? byAni[w.anilistId] : undefined) || byNorm[w.normTitle] || null,
    }));

    const data: AppData = {
      profiles: profileRows.map(profileToClient),
      entries,
      watchlist,
    };
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
