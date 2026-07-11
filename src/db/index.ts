import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// Database location:
//  - local dev:  file:./data/senpai.db (created automatically)
//  - production: set TURSO_DATABASE_URL=libsql://<db>-<org>.turso.io and
//    TURSO_AUTH_TOKEN — the data lives at Turso, so redeploys never touch it.
const DB_URL = process.env.TURSO_DATABASE_URL || "file:" + path.join(process.cwd(), "data", "senpai.db");
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

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
CREATE UNIQUE INDEX IF NOT EXISTS uq_watch_user ON watches (anime_id, user_id);

CREATE TABLE IF NOT EXISTS facts (
  id TEXT PRIMARY KEY,
  anime_id TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  norm_text TEXT NOT NULL,
  at INTEGER NOT NULL
);
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

export type Db = LibSQLDatabase<typeof schema>;

interface DbCache {
  client: Client | null;
  orm: Db | null;
  ready: Promise<void> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _libsql: DbCache | undefined;
}

const cache: DbCache = global._libsql ?? { client: null, orm: null, ready: null };
global._libsql = cache;

function client(): Client {
  if (!cache.client) {
    if (DB_URL.startsWith("file:")) {
      fs.mkdirSync(path.dirname(DB_URL.slice(5)), { recursive: true });
    }
    cache.client = createClient({ url: DB_URL, authToken: AUTH_TOKEN });
  }
  return cache.client;
}

/** Get the ORM, guaranteeing the schema exists (bootstraps on first call). */
export async function getDb(): Promise<Db> {
  if (!cache.orm) {
    const c = client();
    cache.ready = c
      .executeMultiple("PRAGMA foreign_keys = ON;" + DDL)
      .then(() => undefined);
    cache.orm = drizzle(c, { schema });
  }
  await cache.ready;
  return cache.orm;
}

/** Raw client — used by the backup dump. */
export async function getClient(): Promise<Client> {
  await getDb();
  return client();
}

export { schema };
export const newId = () => crypto.randomUUID();
export const now = () => Date.now();
