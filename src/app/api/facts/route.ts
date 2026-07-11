import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema, newId, now } from "@/db";
import { normText, isUniqueViolation } from "@/db/mappers";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/facts { animeId, user, text } — add a fact / bit of trivia.
// Idempotent per user via the uq_fact_user_text DB constraint: the same person
// can't post the same text twice on one show; a different crew member can.
export async function POST(req: NextRequest) {
  try {
    const { animeId, user, text } = await req.json();
    const t = (text || "").trim();
    if (!animeId || !user || !t) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const denied = requireUser(req, user);
    if (denied) return denied;
    const db = await getDb();
    const show = await db.select().from(schema.anime).where(eq(schema.anime.id, animeId)).get();
    if (!show) return NextResponse.json({ error: "not found" }, { status: 404 });

    try {
      await db.insert(schema.facts)
        .values({ id: newId(), animeId, userId: user, text: t, normText: normText(t), at: now() })
        .run();
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json(
          { error: "You already added this exact fact to this show." },
          { status: 409 }
        );
      }
      throw err;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
