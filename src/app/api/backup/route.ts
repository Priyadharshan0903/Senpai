import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { backupNow, listBackups } from "@/db";

export const dynamic = "force-dynamic";

// GET /api/backup            — list available snapshots (newest first)
// GET /api/backup?download=1 — take a fresh consistent snapshot (VACUUM INTO)
//                              and download it as a .db file
// Snapshots also rotate automatically: first DB access of each day writes one
// (keeps the newest 7) into <db dir>/backups on the persistent volume.
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("download")) {
      const file = backupNow();
      const buf = fs.readFileSync(file);
      const name = file.split("/").pop() || "senpai-backup.db";
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.sqlite3",
          "Content-Disposition": `attachment; filename="${name}"`,
          "Content-Length": String(buf.length),
        },
      });
    }
    return NextResponse.json({ backups: listBackups() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
