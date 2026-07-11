import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/db";

export const dynamic = "force-dynamic";

const TABLES = [
  "profiles",
  "anime",
  "watches",
  "facts",
  "fact_confirms",
  "emotes",
  "favs",
  "watchlist",
];

// GET /api/backup            — summary of what a backup would contain
// GET /api/backup?download=1 — download a full JSON dump of every table
// (On Turso the primary copy is managed server-side; this endpoint gives you a
// portable copy you can keep anywhere. For a raw SQL dump use:
//   turso db shell <db-name> .dump > senpai.sql)
export async function GET(req: NextRequest) {
  try {
    const client = await getClient();
    const dump: Record<string, unknown[]> = {};
    for (const t of TABLES) {
      const res = await client.execute(`SELECT * FROM ${t}`);
      dump[t] = res.rows.map((r) => ({ ...r }));
    }

    if (req.nextUrl.searchParams.get("download")) {
      const body = JSON.stringify(
        { app: "senpai", format: 1, exportedAt: new Date().toISOString(), tables: dump },
        null,
        2
      );
      const stamp = new Date().toISOString().slice(0, 10);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="senpai-backup-${stamp}.json"`,
        },
      });
    }

    return NextResponse.json({
      tables: Object.fromEntries(Object.entries(dump).map(([k, v]) => [k, v.length])),
      hint: "add ?download=1 to download the full JSON dump",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
