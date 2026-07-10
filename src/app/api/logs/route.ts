import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AnimeModel, WatchlistModel } from "@/models";
import { norm } from "@/lib/theme";

export const dynamic = "force-dynamic";

interface LogBody {
  user: string;
  title: string;
  rating: number; // crew scale 0-10
  mood: string;
  platform: string;
  reflect?: string;
  momentTitle?: string;
  momentWhy?: string;
  rewatch?: number;
  // metadata for a brand-new show (ignored when appending to an existing one)
  anilistId?: number | null;
  year?: string;
  ep?: string;
  genres?: string[];
  c1?: string;
  c2?: string;
  cover?: string;
}

// POST /api/logs — add a watch. If the title already exists, append the take and
// re-average; otherwise create a new show. Mirrors the prototype's submitAdd().
export async function POST(req: NextRequest) {
  try {
    const b: LogBody = await req.json();
    if (!b.user || !b.title || !b.rating || !b.mood || !b.platform) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }
    await connectDB();

    // Logging a show clears it from the logger's own watchlist (others keep theirs).
    await WatchlistModel.deleteMany({ user: b.user, normTitle: norm(b.title) });

    const myWatch = {
      user: b.user,
      rating: b.rating,
      mood: b.mood,
      platform: b.platform,
      reflect: b.reflect || "(no thoughts added)",
      momentTitle: b.momentTitle || "",
      momentWhy: b.momentWhy || "",
      rewatch: b.rewatch || 0,
    };

    // dup match by normalized title
    const all = await AnimeModel.find().select("title cover watches").lean();
    const dup = (all as { _id: unknown; title: string }[]).find(
      (e) => norm(e.title) === norm(b.title)
    );

    if (dup) {
      const dupDoc = await AnimeModel.findById(dup._id);
      if (!dupDoc) return NextResponse.json({ error: "not found" }, { status: 404 });
      if (dupDoc.watches.some((w: { user: string }) => w.user === b.user)) {
        return NextResponse.json(
          { ok: true, id: String(dupDoc._id), already: true, title: dupDoc.title },
          { status: 200 }
        );
      }
      dupDoc.watches.push(myWatch);
      dupDoc.time = "now";
      if (!dupDoc.cover && b.cover) dupDoc.cover = b.cover;
      await dupDoc.save();
      return NextResponse.json({ ok: true, id: String(dupDoc._id), appended: true, title: dupDoc.title });
    }

    if (!b.genres || b.genres.length === 0) {
      return NextResponse.json({ error: "pick at least one genre" }, { status: 400 });
    }

    const created = await AnimeModel.create({
      anilistId: b.anilistId ?? null,
      title: b.title.trim(),
      year: b.year || "—",
      ep: b.ep || "—",
      genres: b.genres.slice(0, 3),
      c1: b.c1 || "#1a1e25",
      c2: b.c2 || "#141821",
      cover: b.cover || "",
      time: "now",
      emotesBase: {},
      watches: [myWatch],
      facts: [],
    });
    return NextResponse.json({ ok: true, id: String(created._id), created: true, title: created.title });
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
    await connectDB();
    const doc = await AnimeModel.findById(b.animeId);
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    const watch = doc.watches.find((w: { user: string }) => w.user === b.user);
    if (!watch) {
      return NextResponse.json({ error: "you haven't logged this show" }, { status: 404 });
    }
    if (typeof b.rating === "number" && b.rating > 0) watch.rating = b.rating;
    if (typeof b.mood === "string" && b.mood) watch.mood = b.mood;
    if (typeof b.platform === "string" && b.platform) watch.platform = b.platform;
    if (typeof b.reflect === "string") watch.reflect = b.reflect || "(no thoughts added)";
    if (typeof b.momentTitle === "string") watch.momentTitle = b.momentTitle;
    if (typeof b.momentWhy === "string") watch.momentWhy = b.momentWhy;
    if (typeof b.rewatch === "number") watch.rewatch = Math.max(0, b.rewatch);
    doc.markModified("watches");
    await doc.save();
    return NextResponse.json({ ok: true, id: String(doc._id) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
