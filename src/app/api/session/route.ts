import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { attachSessionCookie, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/session { user } — start acting as a crew profile. Sets the signed
// httpOnly cookie that all mutation routes verify against.
export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json();
    if (!user) return NextResponse.json({ error: "user required" }, { status: 400 });

    const db = await getDb();
    const profile = await db.select().from(schema.profiles).where(eq(schema.profiles.id, user)).get();
    if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

    const res = NextResponse.json({ ok: true, user: profile.id });
    attachSessionCookie(res, profile.id);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/session — sign out of the current profile.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
