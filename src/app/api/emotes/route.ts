import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { EmoteModel } from "@/models";

export const dynamic = "force-dynamic";

// POST /api/emotes { animeId, user, emoji } — toggle a reaction. Persisted per
// user; the /api/data aggregate adds these on top of the seeded base counts.
export async function POST(req: NextRequest) {
  try {
    const { animeId, user, emoji } = await req.json();
    if (!animeId || !user || !emoji) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    await connectDB();
    const existing = await EmoteModel.findOne({ anime: animeId, user, emoji });
    if (existing) {
      await existing.deleteOne();
      return NextResponse.json({ ok: true, active: false });
    }
    await EmoteModel.create({ anime: animeId, user, emoji });
    return NextResponse.json({ ok: true, active: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
