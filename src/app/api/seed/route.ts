import { NextResponse } from "next/server";
import { getDb, getRaw, schema, newId, now } from "@/db";
import { SEED_PROFILES, SEED_SHOWS, c1c2 } from "@/lib/seed-data";
import { norm } from "@/lib/theme";
import { normText } from "@/db/mappers";

export const dynamic = "force-dynamic";

// POST /api/seed — wipe and reseed with the 6 shows + 6 crew from the prototype.
export async function POST() {
  try {
    const db = getDb();

    const tx = getRaw().transaction(() => {
      // wipe (order respects FKs; cascades handle children anyway)
      db.delete(schema.watchlist).run();
      db.delete(schema.emotes).run();
      db.delete(schema.favs).run();
      db.delete(schema.factConfirms).run();
      db.delete(schema.facts).run();
      db.delete(schema.watches).run();
      db.delete(schema.anime).run();
      db.delete(schema.profiles).run();

      const t0 = now();
      const keyToId: Record<string, string> = {};
      SEED_PROFILES.forEach((p, i) => {
        const id = newId();
        keyToId[p.key] = id;
        db.insert(schema.profiles)
          .values({
            id,
            name: p.name,
            initial: p.name[0].toUpperCase(),
            color: p.color,
            avatarSeed: p.name,
            custom: 0,
            ord: i,
            createdAt: t0 + i,
          })
          .run();
      });

      SEED_SHOWS.forEach((s, i) => {
        const { c1, c2 } = c1c2(s.color);
        const animeId = newId();
        db.insert(schema.anime)
          .values({
            id: animeId,
            anilistId: s.anilistId,
            title: s.title,
            normTitle: norm(s.title),
            year: s.year,
            ep: s.ep,
            genres: JSON.stringify(s.genres),
            c1,
            c2,
            cover: s.cover,
            time: s.time,
            emotesBase: JSON.stringify(s.emotes),
            createdAt: t0 + i,
            // preserve the design's feed order (fri newest → spy oldest)
            updatedAt: t0 + (SEED_SHOWS.length - i),
          })
          .run();

        s.watches.forEach((w) => {
          db.insert(schema.watches)
            .values({
              animeId,
              userId: keyToId[w.user],
              rating: w.rating,
              mood: w.mood,
              platform: w.platform,
              reflect: w.reflect,
              momentTitle: w.momentTitle || "",
              momentWhy: w.momentWhy || "",
              rewatch: w.rewatch || 0,
              at: t0,
            })
            .run();
        });

        s.facts.forEach((f, fi) => {
          const factId = newId();
          db.insert(schema.facts)
            .values({
              id: factId,
              animeId,
              userId: keyToId[f.user],
              text: f.text,
              normText: normText(f.text),
              at: t0 + fi,
            })
            .run();
          (f.confirms || []).forEach((k) => {
            db.insert(schema.factConfirms).values({ factId, userId: keyToId[k] }).run();
          });
        });

        (s.favs || []).forEach((k) => {
          db.insert(schema.favs).values({ animeId, userId: keyToId[k] }).run();
        });
      });
    });
    tx();

    return NextResponse.json({ ok: true, profiles: SEED_PROFILES.length, shows: SEED_SHOWS.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
