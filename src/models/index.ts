import mongoose, { Schema, model, models } from "mongoose";

// ---- Profile ----
const ProfileSchema = new Schema(
  {
    name: { type: String, required: true },
    initial: { type: String, required: true },
    color: { type: String, required: true },
    avatarSeed: { type: String, required: true },
    custom: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ---- Anime (a logged show) ----
const WatchSchema = new Schema(
  {
    user: { type: String, required: true }, // profile id (string)
    rating: { type: Number, required: true }, // 0-10 crew scale
    mood: { type: String, required: true },
    platform: { type: String, required: true },
    reflect: { type: String, default: "" },
    momentTitle: { type: String, default: "" },
    momentWhy: { type: String, default: "" },
    rewatch: { type: Number, default: 0 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FactSchema = new Schema({
  user: { type: String, required: true },
  text: { type: String, required: true },
  confirms: { type: [String], default: [] },
  at: { type: Date, default: Date.now },
});

const AnimeSchema = new Schema(
  {
    anilistId: { type: Number, default: null },
    title: { type: String, required: true },
    year: { type: String, default: "—" },
    ep: { type: String, default: "—" },
    genres: { type: [String], default: [] },
    c1: { type: String, default: "#1a1e25" },
    c2: { type: String, default: "#141821" },
    cover: { type: String, default: "" },
    emotesBase: { type: Map, of: Number, default: {} },
    favs: { type: [String], default: [] }, // profile ids who favorited
    watches: { type: [WatchSchema], default: [] },
    facts: { type: [FactSchema], default: [] },
    time: { type: String, default: "now" },
  },
  { timestamps: true }
);

// ---- Watchlist (a show someone wants to watch; crew-visible) ----
// Snapshot fields are denormalized from the AniList search because most
// watchlisted shows have no Anime doc yet (nobody has logged them).
const WatchlistSchema = new Schema(
  {
    user: { type: String, required: true }, // profile id
    title: { type: String, required: true },
    normTitle: { type: String, required: true }, // for dedupe + auto-resolve on log
    status: { type: String, enum: ["Watching", "Plan"], default: "Plan" },
    anilistId: { type: Number, default: null },
    cover: { type: String, default: "" },
    year: { type: String, default: "" },
    ep: { type: String, default: "" },
    genres: { type: [String], default: [] },
    c1: { type: String, default: "#1a1e25" },
    c2: { type: String, default: "#141821" },
  },
  { timestamps: true }
);
WatchlistSchema.index({ user: 1, normTitle: 1 }, { unique: true });

// ---- Emote (a single user's reaction toggle) ----
const EmoteSchema = new Schema(
  {
    anime: { type: Schema.Types.ObjectId, ref: "Anime", required: true },
    user: { type: String, required: true },
    emoji: { type: String, required: true },
  },
  { timestamps: true }
);
EmoteSchema.index({ anime: 1, user: 1, emoji: 1 }, { unique: true });

export const ProfileModel = models.Profile || model("Profile", ProfileSchema);
export const AnimeModel = models.Anime || model("Anime", AnimeSchema);
export const EmoteModel = models.Emote || model("Emote", EmoteSchema);
export const WatchlistModel =
  models.Watchlist || model("Watchlist", WatchlistSchema);

export type WatchlistDoc = mongoose.InferSchemaType<typeof WatchlistSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type AnimeDoc = mongoose.InferSchemaType<typeof AnimeSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ProfileDoc = mongoose.InferSchemaType<typeof ProfileSchema> & {
  _id: mongoose.Types.ObjectId;
};
