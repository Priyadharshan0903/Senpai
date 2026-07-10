import { NextRequest } from "next/server";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

// GET /api/avatar?seed=Mei — deterministic DiceBear "adventurer" SVG, generated
// locally (no external call) so it caches offline in the PWA.
export async function GET(req: NextRequest) {
  const seed = req.nextUrl.searchParams.get("seed") || "anon";
  const svg = createAvatar(adventurer, { seed, radius: 50 }).toString();
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
