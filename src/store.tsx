"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActivityEvent, AppData } from "@/lib/types";
import { getActivity, getData, startSession, toggleEmote, toggleFav } from "@/lib/api";
import { ACCENT } from "@/lib/theme";

export type Stage = "pick" | "add" | "app";
export type Screen = "feed" | "ranked" | "watchlist" | "friends" | "platforms" | "add" | "profile";

interface SenpaiCtx {
  acc: string;
  data: AppData | null;
  loading: boolean;
  error: string | null;
  me: string | null;
  stage: Stage;
  screen: Screen;
  detailId: string | null;
  genreFilter: string;
  toast: string;
  addPrefill: string | null;
  wlUsers: string[] | null; // watchlist screen: whose lists are shown (null = just me)
  activity: ActivityEvent[]; // crew events, newest first (mine excluded)
  activityOpen: boolean;
  unread: number; // events newer than my locally-stored last-seen mark

  refresh: () => Promise<void>;
  openActivity: () => void;
  closeActivity: () => void;
  selectProfile: (id: string) => void;
  openAddProfile: () => void;
  switchProfile: () => void;
  enterApp: (id: string) => void;
  setScreen: (s: Screen) => void;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  setGenreFilter: (g: string) => void;
  flash: (m: string) => void;
  reactEmote: (animeId: string, emoji: string) => void;
  toggleFavorite: (animeId: string) => void;
  /** Jump to the Add screen with a title pre-filled (auto-searches). */
  openAddWith: (title: string) => void;
  consumeAddPrefill: () => string | null;
  setWlUsers: (ids: string[] | null) => void;
  /** Open the Watchlist screen focused on one crew member's list. */
  viewUserList: (id: string) => void;
}

const Ctx = createContext<SenpaiCtx | null>(null);
const ME_KEY = "senpai.me";
const seenKey = (id: string) => `senpai.seen.${id}`;

export function SenpaiProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [screen, setScreenState] = useState<Screen>("feed");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState("All");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addPrefillRef = useRef<string | null>(null);
  const [addPrefill, setAddPrefill] = useState<string | null>(null);
  const [wlUsers, setWlUsers] = useState<string[] | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [activityOpen, setActivityOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const newestSeenRef = useRef(0); // newest event `at` from the previous load

  const loadActivity = useCallback(async (meId: string) => {
    try {
      const { events } = await getActivity(meId);
      setActivity(events);
      const lastSeen = Number(localStorage.getItem(seenKey(meId)) || 0);
      setUnread(events.filter((ev) => ev.at > lastSeen).length);
      // toast when something genuinely new lands mid-session
      const newest = events[0]?.at || 0;
      if (newestSeenRef.current && newest > newestSeenRef.current && newest > lastSeen) {
        const ev = events[0];
        setToast(
          ev.type === "emote"
            ? "New reaction from the crew"
            : ev.type === "watchlist"
              ? "Crew watchlist update"
              : ev.type === "fact"
                ? "New fact from the crew"
                : "New log from the crew"
        );
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 1900);
      }
      newestSeenRef.current = newest;
    } catch {
      // notifications are best-effort; never block the app on them
    }
  }, []);

  const refresh = useCallback(async () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(ME_KEY) : null;
    try {
      const d = await getData(stored || undefined);
      setData(d);
      setError(null);
      if (stored) loadActivity(stored);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, [loadActivity]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(ME_KEY) : null;
    if (stored) {
      setMe(stored);
      setStage("app");
      // re-mint the session cookie so mutations stay authorized
      startSession(stored).catch(() => {});
    }
    refresh();
  }, [refresh]);

  const persistMe = (id: string | null) => {
    setMe(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(ME_KEY, id);
      else localStorage.removeItem(ME_KEY);
    }
  };

  const enterApp = (id: string) => {
    persistMe(id);
    setStage("app");
    setScreenState("feed");
    setDetailId(null);
    startSession(id).catch(() => {});
    refresh();
  };

  const value: SenpaiCtx = {
    acc: ACCENT,
    data,
    loading,
    error,
    me,
    stage,
    screen,
    detailId,
    genreFilter,
    toast,
    addPrefill,
    wlUsers,
    activity,
    activityOpen,
    unread,
    refresh,
    openActivity: () => setActivityOpen(true),
    closeActivity: () => {
      setActivityOpen(false);
      setUnread(0);
      if (me && typeof window !== "undefined") {
        localStorage.setItem(seenKey(me), String(Date.now()));
      }
    },
    selectProfile: (id) => enterApp(id),
    openAddProfile: () => setStage("add"),
    switchProfile: () => {
      setStage("pick");
      setDetailId(null);
    },
    enterApp,
    setScreen: (s) => {
      setScreenState(s);
      setDetailId(null);
    },
    openDetail: (id) => setDetailId(id),
    closeDetail: () => setDetailId(null),
    setGenreFilter,
    flash: (m) => {
      setToast(m);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 1900);
    },
    reactEmote: (animeId, emoji) => {
      if (!me) return;
      // optimistic toggle of the current entry's emote count + mine
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: prev.entries.map((e) => {
            if (e.id !== animeId) return e;
            const active = e.mine.includes(emoji);
            return {
              ...e,
              mine: active ? e.mine.filter((x) => x !== emoji) : [...e.mine, emoji],
              emotes: {
                ...e.emotes,
                [emoji]: Math.max(0, (e.emotes[emoji] || 0) + (active ? -1 : 1)),
              },
            };
          }),
        };
      });
      toggleEmote(animeId, me, emoji)
        .then(() => refresh())
        .catch(() => refresh());
    },
    openAddWith: (title) => {
      addPrefillRef.current = title;
      setAddPrefill(title);
      setDetailId(null);
      setScreenState("add");
    },
    consumeAddPrefill: () => {
      const t = addPrefillRef.current;
      addPrefillRef.current = null;
      if (t) setAddPrefill(null);
      return t;
    },
    toggleFavorite: (animeId) => {
      if (!me) return;
      let added = false;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: prev.entries.map((e) => {
            if (e.id !== animeId) return e;
            const has = e.favs.includes(me);
            added = !has;
            return { ...e, favs: has ? e.favs.filter((x) => x !== me) : [...e.favs, me] };
          }),
        };
      });
      setToast(added ? "Added to favorites" : "Removed from favorites");
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 1900);
      toggleFav(animeId, me).catch(() => refresh());
    },
    setWlUsers,
    viewUserList: (id) => {
      setWlUsers([id]);
      setDetailId(null);
      setScreenState("watchlist");
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSenpai(): SenpaiCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSenpai must be used within SenpaiProvider");
  return c;
}
