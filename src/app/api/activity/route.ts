import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { ActivityEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/activity?me=<profileId>&limit=<n> — the crew's recent events
// (logs, reactions, watchlist adds, facts), newest first, excluding the
// viewer's own actions. The client decides what counts as "unread" via a
// locally-stored last-seen timestamp.
export async function GET(req: NextRequest) {
  try {
    const me = req.nextUrl.searchParams.get("me") || "";
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 50));
    const db = await getDb();

    const animeRows = await db.select().from(schema.anime).all();
    const watchRows = await db.select().from(schema.watches).all();
    const emoteRows = await db.select().from(schema.emotes).all();
    const factRows = await db.select().from(schema.facts).all();
    const wlRows = await db.select().from(schema.watchlist).all();

    const animeBy: Record<string, (typeof animeRows)[number]> = {};
    const byNorm: Record<string, string> = {};
    const byAni: Record<number, string> = {};
    for (const a of animeRows) {
      animeBy[a.id] = a;
      byNorm[a.normTitle] = a.id;
      if (a.anilistId != null) byAni[a.anilistId] = a.id;
    }

    const events: ActivityEvent[] = [];

    for (const w of watchRows) {
      if (w.userId === me) continue;
      const a = animeBy[w.animeId];
      if (!a) continue;
      events.push({
        id: `log-${w.id}`,
        type: "log",
        user: w.userId,
        at: w.at,
        entryId: a.id,
        title: a.title,
        cover: a.cover,
        c1: a.c1,
        c2: a.c2,
        rating: w.rating,
        mood: w.mood,
        reflect: w.reflect,
      });
    }

    for (const e of emoteRows) {
      if (e.userId === me || !e.at) continue; // at=0 → legacy, undated reaction
      const a = animeBy[e.animeId];
      if (!a) continue;
      events.push({
        id: `emote-${e.animeId}-${e.userId}-${e.emoji}`,
        type: "emote",
        user: e.userId,
        at: e.at,
        entryId: a.id,
        title: a.title,
        cover: a.cover,
        c1: a.c1,
        c2: a.c2,
        emoji: e.emoji,
      });
    }

    for (const f of factRows) {
      if (f.userId === me) continue;
      const a = animeBy[f.animeId];
      if (!a) continue;
      events.push({
        id: `fact-${f.id}`,
        type: "fact",
        user: f.userId,
        at: f.at,
        entryId: a.id,
        title: a.title,
        cover: a.cover,
        c1: a.c1,
        c2: a.c2,
        text: f.text,
      });
    }

    for (const w of wlRows) {
      if (w.userId === me) continue;
      events.push({
        id: `wl-${w.id}`,
        type: "watchlist",
        user: w.userId,
        at: w.createdAt,
        entryId:
          (w.anilistId != null ? byAni[w.anilistId] : undefined) || byNorm[w.normTitle] || null,
        title: w.title,
        cover: w.cover,
        c1: w.c1,
        c2: w.c2,
        status: w.status,
      });
    }

    events.sort((a, b) => b.at - a.at);
    return NextResponse.json({ events: events.slice(0, limit) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
