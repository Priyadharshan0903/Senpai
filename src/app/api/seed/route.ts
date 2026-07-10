import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AnimeModel, EmoteModel, ProfileModel, WatchlistModel } from "@/models";
import { SEED_PROFILES, SEED_SHOWS, c1c2 } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

// POST /api/seed — wipe and reseed with the 6 shows + 6 crew from the prototype.
export async function POST() {
  try {
    await connectDB();
    await Promise.all([
      ProfileModel.deleteMany({}),
      AnimeModel.deleteMany({}),
      EmoteModel.deleteMany({}),
      WatchlistModel.deleteMany({}),
    ]);

    // profiles -> map seed key to real _id
    const keyToId: Record<string, string> = {};
    for (let i = 0; i < SEED_PROFILES.length; i++) {
      const p = SEED_PROFILES[i];
      const doc = await ProfileModel.create({
        name: p.name,
        initial: p.name[0].toUpperCase(),
        color: p.color,
        avatarSeed: p.name,
        custom: false,
        order: i,
      });
      keyToId[p.key] = String(doc._id);
    }

    for (const s of SEED_SHOWS) {
      const { c1, c2 } = c1c2(s.color);
      await AnimeModel.create({
        anilistId: s.anilistId,
        title: s.title,
        year: s.year,
        ep: s.ep,
        genres: s.genres,
        c1,
        c2,
        cover: s.cover,
        time: s.time,
        emotesBase: s.emotes,
        watches: s.watches.map((w) => ({
          user: keyToId[w.user],
          rating: w.rating,
          mood: w.mood,
          platform: w.platform,
          reflect: w.reflect,
          momentTitle: w.momentTitle || "",
          momentWhy: w.momentWhy || "",
          rewatch: w.rewatch || 0,
        })),
        facts: s.facts.map((f) => ({
          user: keyToId[f.user],
          text: f.text,
          confirms: (f.confirms || []).map((k) => keyToId[k]),
        })),
      });
    }

    return NextResponse.json({ ok: true, profiles: SEED_PROFILES.length, shows: SEED_SHOWS.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
