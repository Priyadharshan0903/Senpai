import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AnimeModel, EmoteModel, ProfileModel } from "@/models";
import { animeToEntry, profileToClient } from "@/lib/serialize";
import { AppData } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/data?me=<profileId> — full app snapshot. `me` marks which emotes the
// viewer reacted with so the client can render the active highlight.
export async function GET(req: NextRequest) {
  try {
    const me = req.nextUrl.searchParams.get("me") || "";
    await connectDB();
    const [profileDocs, animeDocs, emoteDocs] = await Promise.all([
      ProfileModel.find().sort({ order: 1, createdAt: 1 }).lean(),
      AnimeModel.find().sort({ updatedAt: -1 }).lean(),
      EmoteModel.find().lean(),
    ]);

    // animeId -> emoji -> total toggle count, and animeId -> emojis by `me`
    const counts: Record<string, Record<string, number>> = {};
    const mineMap: Record<string, string[]> = {};
    for (const e of emoteDocs as { anime: unknown; emoji: string; user: string }[]) {
      const aid = String(e.anime);
      (counts[aid] ||= {})[e.emoji] = (counts[aid]?.[e.emoji] || 0) + 1;
      if (me && e.user === me) (mineMap[aid] ||= []).push(e.emoji);
    }

    const data: AppData = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profiles: (profileDocs as any[]).map((p) => profileToClient(p)),
      entries: (animeDocs as unknown[]).map((a) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = String((a as any)._id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return animeToEntry(a as any, counts[id] || {}, mineMap[id] || []);
      }),
    };
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
