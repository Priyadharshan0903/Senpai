import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const dynamic = "force-dynamic";

// POST /api/emotes { animeId, user, emoji } — toggle a reaction (unique row).
export async function POST(req: NextRequest) {
  try {
    const { animeId, user, emoji } = await req.json();
    if (!animeId || !user || !emoji) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const db = getDb();
    const cond = and(
      eq(schema.emotes.animeId, animeId),
      eq(schema.emotes.userId, user),
      eq(schema.emotes.emoji, emoji)
    );
    const existing = db.select().from(schema.emotes).where(cond).get();
    if (existing) {
      db.delete(schema.emotes).where(cond).run();
      return NextResponse.json({ ok: true, active: false });
    }
    db.insert(schema.emotes).values({ animeId, userId: user, emoji }).run();
    return NextResponse.json({ ok: true, active: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
