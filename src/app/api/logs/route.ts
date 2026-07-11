import { NextRequest, NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { getDb, schema, newId, now, Db } from "@/db";
import { norm } from "@/lib/theme";

export const dynamic = "force-dynamic";

interface LogBody {
  user: string;
  title: string;
  rating: number; // 0-10 crew scale
  mood: string;
  platform: string;
  reflect?: string;
  momentTitle?: string;
  momentWhy?: string;
  rewatch?: number;
  anilistId?: number | null;
  year?: string;
  ep?: string;
  genres?: string[];
  c1?: string;
  c2?: string;
  cover?: string;
}

/** Find an existing show — anilistId beats title matching. */
async function findDup(db: Db, anilistId: number | null | undefined, title: string) {
  if (anilistId != null) {
    const byId = await db.select().from(schema.anime).where(eq(schema.anime.anilistId, anilistId)).get();
    if (byId) return byId;
  }
  return await db.select().from(schema.anime).where(eq(schema.anime.normTitle, norm(title))).get() ?? null;
}

// POST /api/logs — add a watch. If the show already exists, append the take
// (one take per user is a DB constraint); otherwise create the show.
export async function POST(req: NextRequest) {
  try {
    const b: LogBody = await req.json();
    if (!b.user || !b.title || !b.rating || !b.mood || !b.platform) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }
    const db = await getDb();

    // Logging a show clears it from the logger's own watchlist (others keep theirs).
    const wlCond =
      b.anilistId != null
        ? or(eq(schema.watchlist.normTitle, norm(b.title)), eq(schema.watchlist.anilistId, b.anilistId))
        : eq(schema.watchlist.normTitle, norm(b.title));
    await db.delete(schema.watchlist).where(and(eq(schema.watchlist.userId, b.user), wlCond)).run();

    const watchRow = {
      userId: b.user,
      rating: b.rating,
      mood: b.mood,
      platform: b.platform,
      reflect: (b.reflect || "").trim(),
      momentTitle: b.momentTitle || "",
      momentWhy: b.momentWhy || "",
      rewatch: b.rewatch || 0,
      at: now(),
    };

    const dup = await findDup(db, b.anilistId, b.title);
    if (dup) {
      const mine = await db
        .select()
        .from(schema.watches)
        .where(and(eq(schema.watches.animeId, dup.id), eq(schema.watches.userId, b.user)))
        .get();
      if (mine) {
        return NextResponse.json({ ok: true, id: dup.id, already: true, title: dup.title });
      }
      await db.insert(schema.watches).values({ ...watchRow, animeId: dup.id }).run();
      await db.update(schema.anime)
        .set({ time: "now", updatedAt: now(), cover: dup.cover || b.cover || "" })
        .where(eq(schema.anime.id, dup.id))
        .run();
      return NextResponse.json({ ok: true, id: dup.id, appended: true, title: dup.title });
    }

    if (!b.genres || b.genres.length === 0) {
      return NextResponse.json({ error: "pick at least one genre" }, { status: 400 });
    }

    const animeId = newId();
    await db.insert(schema.anime)
      .values({
        id: animeId,
        anilistId: b.anilistId ?? null,
        title: b.title.trim(),
        normTitle: norm(b.title),
        year: b.year || "—",
        ep: b.ep || "—",
        genres: JSON.stringify(b.genres.slice(0, 3)),
        c1: b.c1 || "#1a1e25",
        c2: b.c2 || "#141821",
        cover: b.cover || "",
        time: "now",
        emotesBase: "{}",
        createdAt: now(),
        updatedAt: now(),
      })
      .run();
    await db.insert(schema.watches).values({ ...watchRow, animeId }).run();
    return NextResponse.json({ ok: true, id: animeId, created: true, title: b.title.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface EditBody {
  animeId: string;
  user: string;
  rating?: number;
  mood?: string;
  platform?: string;
  reflect?: string;
  momentTitle?: string;
  momentWhy?: string;
  rewatch?: number;
}

// PATCH /api/logs — edit your own take on a show. The crew average re-derives
// automatically since it's computed from the watches.
export async function PATCH(req: NextRequest) {
  try {
    const b: EditBody = await req.json();
    if (!b.animeId || !b.user) {
      return NextResponse.json({ error: "missing animeId/user" }, { status: 400 });
    }
    const db = await getDb();
    const watch = await db
      .select()
      .from(schema.watches)
      .where(and(eq(schema.watches.animeId, b.animeId), eq(schema.watches.userId, b.user)))
      .get();
    if (!watch) {
      return NextResponse.json({ error: "you haven't logged this show" }, { status: 404 });
    }

    const updates: Partial<typeof watch> = {};
    if (typeof b.rating === "number" && b.rating > 0) updates.rating = b.rating;
    if (typeof b.mood === "string" && b.mood) updates.mood = b.mood;
    if (typeof b.platform === "string" && b.platform) updates.platform = b.platform;
    if (typeof b.reflect === "string") updates.reflect = b.reflect.trim();
    if (typeof b.momentTitle === "string") updates.momentTitle = b.momentTitle;
    if (typeof b.momentWhy === "string") updates.momentWhy = b.momentWhy;
    if (typeof b.rewatch === "number") updates.rewatch = Math.max(0, b.rewatch);

    if (Object.keys(updates).length > 0) {
      await db.update(schema.watches).set(updates).where(eq(schema.watches.id, watch.id)).run();
    }
    return NextResponse.json({ ok: true, id: b.animeId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
