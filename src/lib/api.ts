import { AppData } from "./types";

async function j<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "request failed");
  return data as T;
}

export async function getData(me?: string): Promise<AppData> {
  const res = await fetch("/api/data" + (me ? "?me=" + encodeURIComponent(me) : ""), {
    cache: "no-store",
  });
  return j<AppData>(res);
}

export async function seedDatabase(): Promise<{ ok: boolean }> {
  return j(await fetch("/api/seed", { method: "POST" }));
}

export async function createProfile(name: string) {
  return j(
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
  );
}

export interface SearchCandidate {
  anilistId: number | null;
  title: string;
  cover: string;
  c1: string;
  c2: string;
  year: string;
  ep: string;
  genres: string[];
}

export interface SearchResult extends SearchCandidate {
  found: boolean;
  matchLabel: string;
  candidates: SearchCandidate[];
}

export async function searchAnime(q: string): Promise<SearchResult> {
  return j<SearchResult>(await fetch("/api/anime/search?q=" + encodeURIComponent(q)));
}

export interface LogPayload {
  user: string;
  title: string;
  rating: number;
  mood: string;
  platform: string;
  reflect?: string;
  momentTitle?: string;
  momentWhy?: string;
  rewatch?: number;
  anilistId?: number | null;
  year?: string;
  ep?: string;
  genres?: string[];
  c1?: string;
  c2?: string;
  cover?: string;
}

export async function postLog(payload: LogPayload) {
  return j<{ ok: boolean; id: string; created?: boolean; appended?: boolean; already?: boolean; title: string }>(
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function toggleEmote(animeId: string, user: string, emoji: string) {
  return j(
    await fetch("/api/emotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, user, emoji }),
    })
  );
}

export async function postFact(animeId: string, user: string, text: string) {
  return j(
    await fetch("/api/facts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, user, text }),
    })
  );
}

export async function confirmFact(animeId: string, factId: string, user: string) {
  return j(
    await fetch("/api/facts/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, factId, user }),
    })
  );
}

export interface WatchlistPayload {
  user: string;
  title: string;
  status?: "Watching" | "Plan";
  anilistId?: number | null;
  cover?: string;
  year?: string;
  ep?: string;
  genres?: string[];
  c1?: string;
  c2?: string;
}

export async function addToWatchlist(payload: WatchlistPayload) {
  return j<{ ok: boolean; id: string; already?: boolean }>(
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function removeFromWatchlist(id: string, user: string) {
  return j<{ ok: boolean }>(
    await fetch(
      "/api/watchlist?id=" + encodeURIComponent(id) + "&user=" + encodeURIComponent(user),
      { method: "DELETE" }
    )
  );
}

export interface EditLogPayload {
  animeId: string;
  user: string;
  rating?: number;
  mood?: string;
  platform?: string;
  reflect?: string;
  momentTitle?: string;
  momentWhy?: string;
  rewatch?: number;
}

export async function editLog(payload: EditLogPayload) {
  return j<{ ok: boolean; id: string }>(
    await fetch("/api/logs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateProfile(payload: { id: string; avatarSeed?: string; name?: string }) {
  return j<{ id: string; name: string; avatar: string }>(
    await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function setWatchlistStatus(id: string, user: string, status: "Watching" | "Plan") {
  return j<{ ok: boolean; status: string }>(
    await fetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, user, status }),
    })
  );
}

export async function setCover(id: string, cover: string) {
  return j<{ ok: boolean; cover: string }>(
    await fetch("/api/anime", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, cover }),
    })
  );
}

export async function toggleFav(animeId: string, user: string) {
  return j<{ ok: boolean; fav: boolean }>(
    await fetch("/api/favs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, user }),
    })
  );
}
