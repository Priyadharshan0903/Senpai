import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema, newId, now } from "@/db";
import { profileToClient, isUniqueViolation } from "@/db/mappers";
import { ACCENT } from "@/lib/theme";

export const dynamic = "force-dynamic";

const NAME_TAKEN = "That name is already picked — try another.";

// POST /api/profiles { name } — create a custom crew profile (avatar auto-generated).
// Unique names are enforced by the DB (case-insensitive index on lower(name)).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body?.name || "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const db = await getDb();
    const count = (await db.select().from(schema.profiles).all()).length;
    const row = {
      id: newId(),
      name,
      initial: name[0].toUpperCase(),
      color: ACCENT,
      avatarSeed: name,
      custom: 1,
      ord: count,
      createdAt: now(),
    };
    try {
      await db.insert(schema.profiles).values(row).run();
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json({ error: NAME_TAKEN }, { status: 409 });
      }
      throw err;
    }
    return NextResponse.json(profileToClient(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/profiles { id, avatarSeed?, name? } — update your profile.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const db = await getDb();
    const existing = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id)).get();
    if (!existing) return NextResponse.json({ error: "profile not found" }, { status: 404 });

    const updates: Partial<typeof existing> = {};
    if (typeof body.name === "string" && body.name.trim()) {
      const nm = body.name.trim();
      updates.name = nm;
      updates.initial = nm[0].toUpperCase();
    }
    if (typeof body.avatarSeed === "string" && body.avatarSeed.trim()) {
      updates.avatarSeed = body.avatarSeed.trim();
    }
    if (Object.keys(updates).length > 0) {
      try {
        await db.update(schema.profiles).set(updates).where(eq(schema.profiles.id, id)).run();
      } catch (err) {
        if (isUniqueViolation(err)) {
          return NextResponse.json({ error: NAME_TAKEN }, { status: 409 });
        }
        throw err;
      }
    }
    return NextResponse.json(profileToClient({ ...existing, ...updates }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
