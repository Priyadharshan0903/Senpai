import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AnimeModel } from "@/models";

export const dynamic = "force-dynamic";

/** Normalize for duplicate comparison: trim, collapse whitespace, lowercase.
 *  "The OP charted  worldwide" === "the op charted worldwide" */
function normText(s: string): string {
  return (s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

// POST /api/facts { animeId, user, text } — add a fact / bit of trivia.
// Idempotent per user: the same person can't post the same text twice on the
// same show (409). A different crew member posting identical text is fine.
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

    const dupOfMine = doc.facts.some(
      (f: { user: string; text: string }) =>
        f.user === user && normText(f.text) === normText(t)
    );
    if (dupOfMine) {
      return NextResponse.json(
        { error: "You already added this exact fact to this show." },
        { status: 409 }
      );
    }

    doc.facts.push({ user, text: t, confirms: [] });
    await doc.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
