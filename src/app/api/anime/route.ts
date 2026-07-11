import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema, now } from "@/db";

export const dynamic = "force-dynamic";

const HTTP_URL = /^https?:\/\/.+/i;

// PATCH /api/anime { id, cover } — set or remove a show's background art.
// cover: "https://..." sets it; "" (empty string) removes it and the card
// falls back to its c1/c2 gradient.
export async function PATCH(req: NextRequest) {
  try {
    const { id, cover } = await req.json();
    if (!id || typeof cover !== "string") {
      return NextResponse.json({ error: "missing id/cover" }, { status: 400 });
    }
    const trimmed = cover.trim();
    if (trimmed && !HTTP_URL.test(trimmed)) {
      return NextResponse.json({ error: "cover must be an http(s) image URL" }, { status: 400 });
    }
    const db = getDb();
    const doc = db.select().from(schema.anime).where(eq(schema.anime.id, id)).get();
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    db.update(schema.anime).set({ cover: trimmed, updatedAt: now() }).where(eq(schema.anime.id, id)).run();
    return NextResponse.json({ ok: true, cover: trimmed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
