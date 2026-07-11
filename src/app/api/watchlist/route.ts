import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema, newId, now } from "@/db";
import { norm } from "@/lib/theme";
import { isUniqueViolation } from "@/db/mappers";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/watchlist — save a show to the caller's watchlist (crew-visible).
// Dedupe per user is the uq_watchlist DB constraint.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const title = (b?.title || "").trim();
    if (!b?.user || !title) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const denied = requireUser(req, b.user);
    if (denied) return denied;
    const db = await getDb();
    const normTitle = norm(title);
    const row = {
      id: newId(),
      userId: b.user,
      title,
      normTitle,
      status: b.status === "Watching" ? "Watching" : "Plan",
      anilistId: b.anilistId ?? null,
      cover: b.cover || "",
      year: b.year || "",
      ep: b.ep || "",
      genres: JSON.stringify((b.genres || []).slice(0, 3)),
      c1: b.c1 || "#1a1e25",
      c2: b.c2 || "#141821",
      createdAt: now(),
    };
    try {
      await db.insert(schema.watchlist).values(row).run();
    } catch (err) {
      if (isUniqueViolation(err)) {
        const existing = await db
          .select()
          .from(schema.watchlist)
          .where(and(eq(schema.watchlist.userId, b.user), eq(schema.watchlist.normTitle, normTitle)))
          .get();
        return NextResponse.json({ ok: true, id: existing?.id || "", already: true });
      }
      throw err;
    }
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/watchlist?id=<itemId>&user=<profileId> — remove your own item.
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const user = req.nextUrl.searchParams.get("user");
    if (!id || !user) {
      return NextResponse.json({ error: "missing id/user" }, { status: 400 });
    }
    const denied = requireUser(req, user);
    if (denied) return denied;
    const db = await getDb();
    const doc = await db.select().from(schema.watchlist).where(eq(schema.watchlist.id, id)).get();
    if (!doc) return NextResponse.json({ ok: true, gone: true });
    if (doc.userId !== user) {
      return NextResponse.json({ error: "not your watchlist item" }, { status: 403 });
    }
    await db.delete(schema.watchlist).where(eq(schema.watchlist.id, id)).run();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/watchlist { id, user, status } — flip an item between
// "Watching" and "Plan" (only your own items).
export async function PATCH(req: NextRequest) {
  try {
    const { id, user, status } = await req.json();
    if (!id || !user || !["Watching", "Plan"].includes(status)) {
      return NextResponse.json({ error: "missing/invalid fields" }, { status: 400 });
    }
    const denied = requireUser(req, user);
    if (denied) return denied;
    const db = await getDb();
    const doc = await db.select().from(schema.watchlist).where(eq(schema.watchlist.id, id)).get();
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (doc.userId !== user) {
      return NextResponse.json({ error: "not your watchlist item" }, { status: 403 });
    }
    await db.update(schema.watchlist).set({ status }).where(eq(schema.watchlist.id, id)).run();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
