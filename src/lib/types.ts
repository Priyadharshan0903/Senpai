// Shared types for the Senpai client + API. The `Entry` shape mirrors the
// prototype's aggregated data model (anime + its watches + facts + emotes).

export interface Profile {
  id: string;
  name: string;
  initial: string;
  color: string;
  avatar: string; // resolved DiceBear url
  custom?: boolean;
}

export interface Watch {
  user: string; // profile id
  rating: number; // 0-10 (crew scale)
  mood: string;
  platform: string;
  reflect: string;
  momentTitle: string;
  momentWhy: string;
  rewatch: number;
}

export interface Fact {
  id: string;
  user: string; // profile id
  text: string;
  confirms: string[]; // profile ids
}

export interface Entry {
  id: string;
  anilistId?: number | null;
  title: string;
  year: string;
  ep: string;
  genres: string[];
  c1: string;
  c2: string;
  cover: string;
  time: string;
  emotes: Record<string, number>;
  mine: string[]; // emojis the current viewer has reacted with
  watches: Watch[];
  facts: Fact[];
  createdAt?: string;
}

/** A crew member's want-to-watch item (crew-visible). */
export interface WatchlistItem {
  id: string;
  user: string; // profile id
  title: string;
  anilistId?: number | null;
  cover: string;
  year: string;
  ep: string;
  genres: string[];
  c1: string;
  c2: string;
  entryId: string | null; // resolved Anime id if the crew already logged it
}

/** Full app snapshot returned by GET /api/data — client renders every view from this. */
export interface AppData {
  profiles: Profile[];
  entries: Entry[];
  watchlist: WatchlistItem[];
}

export interface AniMeta {
  cover: string;
  color: string;
  year: string;
  ep: string;
  genres: string[];
  romaji: string;
}
