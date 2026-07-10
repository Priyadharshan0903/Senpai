"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppData } from "@/lib/types";
import { getData, toggleEmote } from "@/lib/api";
import { ACCENT } from "@/lib/theme";

export type Stage = "pick" | "add" | "app";
export type Screen = "feed" | "ranked" | "platforms" | "add" | "profile";

interface CanonCtx {
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

  refresh: () => Promise<void>;
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
}

const Ctx = createContext<CanonCtx | null>(null);
const ME_KEY = "canon.me";

export function CanonProvider({ children }: { children: React.ReactNode }) {
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

  const refresh = useCallback(async () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(ME_KEY) : null;
    try {
      const d = await getData(stored || undefined);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(ME_KEY) : null;
    if (stored) {
      setMe(stored);
      setStage("app");
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
    refresh();
  };

  const value: CanonCtx = {
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
    refresh,
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
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCanon(): CanonCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCanon must be used within CanonProvider");
  return c;
}
