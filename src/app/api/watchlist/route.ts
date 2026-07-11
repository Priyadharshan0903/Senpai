import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WatchlistModel } from "@/models";
import { norm } from "@/lib/theme";

export const dynamic = "force-dynamic";

// POST /api/watchlist — save a show to the caller's watchlist (crew-visible).
// Body: { user, title, anilistId?, cover?, year?, ep?, genres?, c1?, c2? }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const title = (b?.title || "").trim();
    if (!b?.user || !title) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    await connectDB();
    const normTitle = norm(title);
    const existing = await WatchlistModel.findOne({ user: b.user, normTitle });
    if (existing) {
      return NextResponse.json({ ok: true, id: String(existing._id), already: true });
    }
    const doc = await WatchlistModel.create({
      user: b.user,
      title,
      normTitle,
      status: b.status === "Watching" ? "Watching" : "Plan",
      anilistId: b.anilistId ?? null,
      cover: b.cover || "",
      year: b.year || "",
      ep: b.ep || "",
      genres: (b.genres || []).slice(0, 3),
      c1: b.c1 || "#1a1e25",
      c2: b.c2 || "#141821",
    });
    return NextResponse.json({ ok: true, id: String(doc._id) });
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
    await connectDB();
    const doc = await WatchlistModel.findById(id);
    if (!doc) return NextResponse.json({ ok: true, gone: true });
    if (doc.user !== user) {
      return NextResponse.json({ error: "not your watchlist item" }, { status: 403 });
    }
    await doc.deleteOne();
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
    await connectDB();
    const doc = await WatchlistModel.findById(id);
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (doc.user !== user) {
      return NextResponse.json({ error: "not your watchlist item" }, { status: 403 });
    }
    doc.status = status;
    await doc.save();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
