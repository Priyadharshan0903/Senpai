import { NextResponse } from "next/server";
import { getDb, schema, newId, now } from "@/db";
import { SEED_PROFILES, SEED_SHOWS, c1c2 } from "@/lib/seed-data";
import { norm } from "@/lib/theme";
import { normText } from "@/db/mappers";

export const dynamic = "force-dynamic";

// POST /api/seed — wipe and reseed with the 6 shows + 6 crew from the prototype.
export async function POST() {
  try {
    const db = await getDb();

    await db.transaction(async (tx) => {
      // wipe (order respects FKs; cascades handle children anyway)
      await tx.delete(schema.watchlist).run();
      await tx.delete(schema.emotes).run();
      await tx.delete(schema.favs).run();
      await tx.delete(schema.factConfirms).run();
      await tx.delete(schema.facts).run();
      await tx.delete(schema.watches).run();
      await tx.delete(schema.anime).run();
      await tx.delete(schema.profiles).run();

      const t0 = now();
      const keyToId: Record<string, string> = {};
      for (let i = 0; i < SEED_PROFILES.length; i++) {
        const p = SEED_PROFILES[i];
        const id = newId();
        keyToId[p.key] = id;
        await tx
          .insert(schema.profiles)
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
      }

      for (let i = 0; i < SEED_SHOWS.length; i++) {
        const s = SEED_SHOWS[i];
        const { c1, c2 } = c1c2(s.color);
        const animeId = newId();
        await tx
          .insert(schema.anime)
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

        for (const w of s.watches) {
          await tx
            .insert(schema.watches)
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
        }

        for (let fi = 0; fi < s.facts.length; fi++) {
          const f = s.facts[fi];
          const factId = newId();
          await tx
            .insert(schema.facts)
            .values({
              id: factId,
              animeId,
              userId: keyToId[f.user],
              text: f.text,
              normText: normText(f.text),
              at: t0 + fi,
            })
            .run();
          for (const k of f.confirms || []) {
            await tx.insert(schema.factConfirms).values({ factId, userId: keyToId[k] }).run();
          }
        }

        for (const k of s.favs || []) {
          await tx.insert(schema.favs).values({ animeId, userId: keyToId[k] }).run();
        }
      }
    });

    return NextResponse.json({ ok: true, profiles: SEED_PROFILES.length, shows: SEED_SHOWS.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
