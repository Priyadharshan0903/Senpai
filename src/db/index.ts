import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// DB file location:
//  - local dev: ./data/senpai.db
//  - Railway:   set SQLITE_PATH=/data/senpai.db and mount a persistent Volume
//    at /data (Service → Settings → Volumes) so redeploys never lose data.
const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "senpai.db");

const DDL = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initial TEXT NOT NULL,
  color TEXT NOT NULL,
  avatar_seed TEXT NOT NULL,
  custom INTEGER NOT NULL DEFAULT 0,
  ord INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
-- case-insensitive unique names ("Ravi" == "ravi")
CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_name ON profiles (lower(name));

CREATE TABLE IF NOT EXISTS anime (
  id TEXT PRIMARY KEY,
  anilist_id INTEGER,
  title TEXT NOT NULL,
  norm_title TEXT NOT NULL,
  year TEXT NOT NULL DEFAULT '—',
  ep TEXT NOT NULL DEFAULT '—',
  genres TEXT NOT NULL DEFAULT '[]',
  c1 TEXT NOT NULL DEFAULT '#1a1e25',
  c2 TEXT NOT NULL DEFAULT '#141821',
  cover TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT 'now',
  emotes_base TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_anime_norm ON anime (norm_title);

CREATE TABLE IF NOT EXISTS watches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anime_id TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating REAL NOT NULL,
  mood TEXT NOT NULL,
  platform TEXT NOT NULL,
  reflect TEXT NOT NULL DEFAULT '',
  moment_title TEXT NOT NULL DEFAULT '',
  moment_why TEXT NOT NULL DEFAULT '',
  rewatch INTEGER NOT NULL DEFAULT 0,
  at INTEGER NOT NULL
);
-- one take per user per show
CREATE UNIQUE INDEX IF NOT EXISTS uq_watch_user ON watches (anime_id, user_id);

CREATE TABLE IF NOT EXISTS facts (
  id TEXT PRIMARY KEY,
  anime_id TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  norm_text TEXT NOT NULL,
  at INTEGER NOT NULL
);
-- same person can't post the same fact twice on one show
CREATE UNIQUE INDEX IF NOT EXISTS uq_fact_user_text ON facts (anime_id, user_id, norm_text);

CREATE TABLE IF NOT EXISTS fact_confirms (
  fact_id TEXT NOT NULL REFERENCES facts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_confirm ON fact_confirms (fact_id, user_id);

CREATE TABLE IF NOT EXISTS emotes (
  anime_id TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_emote ON emotes (anime_id, user_id, emoji);

CREATE TABLE IF NOT EXISTS favs (
  anime_id TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fav ON favs (anime_id, user_id);

CREATE TABLE IF NOT EXISTS watchlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  norm_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Plan',
  anilist_id INTEGER,
  cover TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  ep TEXT NOT NULL DEFAULT '',
  genres TEXT NOT NULL DEFAULT '[]',
  c1 TEXT NOT NULL DEFAULT '#1a1e25',
  c2 TEXT NOT NULL DEFAULT '#141821',
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_watchlist ON watchlist (user_id, norm_title);
`;

interface DbCache {
  raw: Database.Database | null;
  orm: BetterSQLite3Database<typeof schema> | null;
  lastBackupDay: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _sqlite: DbCache | undefined;
}

const cache: DbCache = global._sqlite ?? { raw: null, orm: null, lastBackupDay: null };
global._sqlite = cache;

function open(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const raw = new Database(DB_PATH);
  raw.pragma("journal_mode = WAL"); // safe concurrent reads, atomic writes
  raw.pragma("foreign_keys = ON");
  raw.exec(DDL);
  return raw;
}

export function getRaw(): Database.Database {
  if (!cache.raw) cache.raw = open();
  return cache.raw;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!cache.orm) cache.orm = drizzle(getRaw(), { schema });
  maybeDailyBackup();
  return cache.orm;
}

// ---------- backups ----------
// A consistent snapshot is written with VACUUM INTO (works while the app is
// live). Daily rotation: first DB access of each day snapshots into
// <dbdir>/backups/senpai-YYYY-MM-DD.db and prunes to the newest 7.

const BACKUP_DIR = path.join(path.dirname(DB_PATH), "backups");
const KEEP = 7;

export function backupNow(): string {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const file = path.join(BACKUP_DIR, `senpai-${stamp}.db`);
  // VACUUM INTO refuses to overwrite — replace the same-day snapshot
  if (fs.existsSync(file)) fs.unlinkSync(file);
  getRaw().exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  prune();
  return file;
}

function prune() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("senpai-") && f.endsWith(".db"))
    .sort(); // date-stamped names sort chronologically
  for (const f of files.slice(0, Math.max(0, files.length - KEEP))) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
  }
}

function maybeDailyBackup() {
  const today = new Date().toISOString().slice(0, 10);
  if (cache.lastBackupDay === today) return;
  cache.lastBackupDay = today;
  try {
    // skip the very first boot on an empty DB
    const row = getRaw().prepare("SELECT COUNT(*) AS n FROM profiles").get() as { n: number };
    if (row.n > 0) backupNow();
  } catch {
    // backups must never take the app down
  }
}

export function listBackups(): { name: string; size: number; mtime: string }[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("senpai-") && f.endsWith(".db"))
    .sort()
    .reverse()
    .map((name) => {
      const st = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, size: st.size, mtime: st.mtime.toISOString() };
    });
}

export { schema };
export const newId = () => crypto.randomUUID();
export const now = () => Date.now();
