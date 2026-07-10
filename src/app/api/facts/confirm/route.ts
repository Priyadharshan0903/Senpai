import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AnimeModel } from "@/models";

export const dynamic = "force-dynamic";

// POST /api/facts/confirm { animeId, factId, user } — toggle the current user's
// confirmation. 2+ confirms flips a fact to VERIFIED on the client.
export async function POST(req: NextRequest) {
  try {
    const { animeId, factId, user } = await req.json();
    if (!animeId || !factId || !user) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    await connectDB();
    const doc = await AnimeModel.findById(animeId);
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    const fact = doc.facts.id(factId);
    if (!fact) return NextResponse.json({ error: "fact not found" }, { status: 404 });
    const has = fact.confirms.includes(user);
    fact.confirms = has
      ? fact.confirms.filter((x: string) => x !== user)
      : [...fact.confirms, user];
    await doc.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
