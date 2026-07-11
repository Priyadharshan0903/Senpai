import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/facts/confirm { animeId, factId, user } — toggle the current user's
// confirmation. 2+ confirms flips a fact to VERIFIED on the client.
export async function POST(req: NextRequest) {
  try {
    const { factId, user } = await req.json();
    if (!factId || !user) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const denied = requireUser(req, user);
    if (denied) return denied;
    const db = await getDb();
    const fact = await db.select().from(schema.facts).where(eq(schema.facts.id, factId)).get();
    if (!fact) return NextResponse.json({ error: "fact not found" }, { status: 404 });

    const existing = await db
      .select()
      .from(schema.factConfirms)
      .where(and(eq(schema.factConfirms.factId, factId), eq(schema.factConfirms.userId, user)))
      .get();
    if (existing) {
      await db.delete(schema.factConfirms)
        .where(and(eq(schema.factConfirms.factId, factId), eq(schema.factConfirms.userId, user)))
        .run();
    } else {
      await db.insert(schema.factConfirms).values({ factId, userId: user }).run();
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
