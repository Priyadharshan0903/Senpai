import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProfileModel } from "@/models";
import { profileToClient } from "@/lib/serialize";
import { ACCENT } from "@/lib/theme";

export const dynamic = "force-dynamic";

// POST /api/profiles { name } — create a custom crew profile (avatar auto-generated).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body?.name || "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    await connectDB();
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
