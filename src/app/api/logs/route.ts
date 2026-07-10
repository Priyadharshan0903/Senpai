import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AnimeModel } from "@/models";
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
