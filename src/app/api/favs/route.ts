import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const dynamic = "force-dynamic";

// POST /api/favs { animeId, user } — toggle a show in the user's favorites.
export async function POST(req: NextRequest) {
  try {
    const { animeId, user } = await req.json();
    if (!animeId || !user) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const db = await getDb();
    const cond = and(eq(schema.favs.animeId, animeId), eq(schema.favs.userId, user));
    const existing = await db.select().from(schema.favs).where(cond).get();
    if (existing) {
      await db.delete(schema.favs).where(cond).run();
      return NextResponse.json({ ok: true, fav: false });
    }
    await db.insert(schema.favs).values({ animeId, userId: user }).run();
    return NextResponse.json({ ok: true, fav: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
