import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AnimeModel } from "@/models";

export const dynamic = "force-dynamic";

// POST /api/favs { animeId, user } — toggle a show in the user's favorites.
export async function POST(req: NextRequest) {
  try {
    const { animeId, user } = await req.json();
    if (!animeId || !user) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    await connectDB();
    const doc = await AnimeModel.findById(animeId);
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    const has = doc.favs.includes(user);
    doc.favs = has ? doc.favs.filter((x: string) => x !== user) : [...doc.favs, user];
    await doc.save();
    return NextResponse.json({ ok: true, fav: !has });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
