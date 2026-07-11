import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// All app-level integrity rules live here as real constraints:
//  - unique profile names (case-insensitive, via expression index in bootstrap)
//  - one take per user per show
//  - per-user duplicate-fact guard
//  - emote/fav/confirm toggles as unique rows

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  initial: text("initial").notNull(),
  color: text("color").notNull(),
  avatarSeed: text("avatar_seed").notNull(),
  custom: integer("custom").notNull().default(0),
  ord: integer("ord").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const anime = sqliteTable("anime", {
  id: text("id").primaryKey(),
  anilistId: integer("anilist_id"),
  title: text("title").notNull(),
  normTitle: text("norm_title").notNull(),
  year: text("year").notNull().default("—"),
  ep: text("ep").notNull().default("—"),
  genres: text("genres").notNull().default("[]"), // JSON string[]
  c1: text("c1").notNull().default("#1a1e25"),
  c2: text("c2").notNull().default("#141821"),
  cover: text("cover").notNull().default(""),
  time: text("time").notNull().default("now"),
  emotesBase: text("emotes_base").notNull().default("{}"), // JSON {emoji: n}
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const watches = sqliteTable(
  "watches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    animeId: text("anime_id").notNull().references(() => anime.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    rating: real("rating").notNull(),
    mood: text("mood").notNull(),
    platform: text("platform").notNull(),
    reflect: text("reflect").notNull().default(""),
    momentTitle: text("moment_title").notNull().default(""),
    momentWhy: text("moment_why").notNull().default(""),
    rewatch: integer("rewatch").notNull().default(0),
    at: integer("at").notNull(),
  },
  (t) => [uniqueIndex("uq_watch_user").on(t.animeId, t.userId)]
);

export const facts = sqliteTable(
  "facts",
  {
    id: text("id").primaryKey(),
    animeId: text("anime_id").notNull().references(() => anime.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    normText: text("norm_text").notNull(),
    at: integer("at").notNull(),
  },
  // per-user idempotency: the same person can't post the same fact twice on one show
  (t) => [uniqueIndex("uq_fact_user_text").on(t.animeId, t.userId, t.normText)]
);

export const factConfirms = sqliteTable(
  "fact_confirms",
  {
    factId: text("fact_id").notNull().references(() => facts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("uq_confirm").on(t.factId, t.userId)]
);

export const emotes = sqliteTable(
  "emotes",
  {
    animeId: text("anime_id").notNull().references(() => anime.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    // 0 = legacy row from before reactions were timestamped
    at: integer("at").notNull().default(0),
  },
  (t) => [uniqueIndex("uq_emote").on(t.animeId, t.userId, t.emoji)]
);

export const favs = sqliteTable(
  "favs",
  {
    animeId: text("anime_id").notNull().references(() => anime.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("uq_fav").on(t.animeId, t.userId)]
);

export const watchlist = sqliteTable(
  "watchlist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    normTitle: text("norm_title").notNull(),
    status: text("status").notNull().default("Plan"), // Watching | Plan
    anilistId: integer("anilist_id"),
    cover: text("cover").notNull().default(""),
    year: text("year").notNull().default(""),
    ep: text("ep").notNull().default(""),
    genres: text("genres").notNull().default("[]"),
    c1: text("c1").notNull().default("#1a1e25"),
    c2: text("c2").notNull().default("#141821"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("uq_watchlist").on(t.userId, t.normTitle)]
);
