import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AnimeModel } from "@/models";

export const dynamic = "force-dynamic";

// POST /api/facts { animeId, user, text } — add a fact / bit of trivia.
export async function POST(req: NextRequest) {
  try {
    const { animeId, user, text } = await req.json();
    const t = (text || "").trim();
    if (!animeId || !user || !t) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    await connectDB();
    const doc = await AnimeModel.findById(animeId);
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    doc.facts.push({ user, text: t, confirms: [] });
    await doc.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
