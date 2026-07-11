import { AnimeDoc, ProfileDoc } from "@/models";
import { Entry, Profile } from "./types";
import { avatarUrl } from "./avatar";

export function profileToClient(p: ProfileDoc): Profile {
  return {
    id: String(p._id),
    name: p.name,
    initial: p.initial,
    color: p.color,
    avatar: avatarUrl(p.avatarSeed),
    custom: p.custom,
  };
}

/**
 * Turn an Anime doc + its per-user emote toggles into the client Entry shape.
 * `userEmotes` maps `${emoji}` -> extra count (base + toggles already merged).
 */
export function animeToEntry(
  a: AnimeDoc,
  emoteCounts: Record<string, number>,
  mine: string[] = []
): Entry {
  // emotesBase is a Map on hydrated docs but a plain object after .lean()
  const base: Record<string, number> = {};
  const eb = a.emotesBase as unknown;
  if (eb instanceof Map) {
    for (const [k, v] of eb as Map<string, number>) base[k] = v;
  } else if (eb && typeof eb === "object") {
    Object.assign(base, eb as Record<string, number>);
  }
  const emotes: Record<string, number> = { ...base };
  for (const [emoji, extra] of Object.entries(emoteCounts)) {
    emotes[emoji] = (emotes[emoji] || 0) + extra;
  }
  return {
    id: String(a._id),
    anilistId: a.anilistId ?? null,
    title: a.title,
    year: a.year,
    ep: a.ep,
    genres: a.genres,
    c1: a.c1,
    c2: a.c2,
    cover: a.cover || "",
    time: a.time || "now",
    emotes,
    mine,
    favs: (a as { favs?: string[] }).favs || [],
    watches: (a.watches || []).map((w) => ({
      user: w.user,
      rating: w.rating,
      mood: w.mood,
      platform: w.platform,
      reflect: w.reflect || "",
      momentTitle: w.momentTitle || "",
      momentWhy: w.momentWhy || "",
      rewatch: w.rewatch || 0,
    })),
    facts: (a.facts || []).map((f) => ({
      id: String((f as { _id?: unknown })._id ?? ""),
      user: f.user,
      text: f.text,
      confirms: f.confirms || [],
    })),
    createdAt: (a as { createdAt?: Date }).createdAt?.toISOString(),
  };
}
