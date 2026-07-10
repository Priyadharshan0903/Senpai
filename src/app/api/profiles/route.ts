import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProfileModel } from "@/models";
import { profileToClient } from "@/lib/serialize";
import { ACCENT } from "@/lib/theme";

export const dynamic = "force-dynamic";

async function nameTaken(name: string, excludeId?: string): Promise<boolean> {
  const docs = await ProfileModel.find().select("name").lean();
  const target = name.trim().toLowerCase();
  return (docs as { _id: unknown; name: string }[]).some(
    (p) => p.name.trim().toLowerCase() === target && String(p._id) !== excludeId
  );
}

// POST /api/profiles { name } — create a custom crew profile (avatar auto-generated).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body?.name || "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    await connectDB();
    if (await nameTaken(name)) {
      return NextResponse.json(
        { error: "That name is already picked — try another." },
        { status: 409 }
      );
    }
    const count = await ProfileModel.countDocuments();
    const doc = await ProfileModel.create({
      name,
      initial: name[0].toUpperCase(),
      color: ACCENT,
      avatarSeed: name,
      custom: true,
      order: count,
    });
    return NextResponse.json(profileToClient(doc));
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

    await connectDB();
    const doc = await ProfileModel.findById(id);
    if (!doc) return NextResponse.json({ error: "profile not found" }, { status: 404 });

    if (typeof body.name === "string" && body.name.trim()) {
      const name = body.name.trim();
      if (await nameTaken(name, id)) {
        return NextResponse.json(
          { error: "That name is already picked — try another." },
          { status: 409 }
        );
      }
      doc.name = name;
      doc.initial = name[0].toUpperCase();
    }
    if (typeof body.avatarSeed === "string" && body.avatarSeed.trim()) {
      doc.avatarSeed = body.avatarSeed.trim();
    }
    await doc.save();
    return NextResponse.json(profileToClient(doc));
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
