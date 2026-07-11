"use client";

import React from "react";
import { useSenpai, Screen } from "@/store";

const items: { key: Screen; label: string; icon: (c: string) => React.ReactNode }[] = [
  {
    key: "feed",
    label: "Feed",
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="6" rx="2" />
        <rect x="4" y="14" width="16" height="6" rx="2" />
      </svg>
    ),
  },
  {
    key: "ranked",
    label: "Ranked",
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 20V10M12 20V4M18 20v-7" />
      </svg>
    ),
  },
  {
    key: "watchlist",
    label: "Watchlist",
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    key: "friends",
    label: "Friends",
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2" />
        <circle cx="17.6" cy="9" r="2.5" />
        <path d="M16.2 15c2.7.1 4.6 2.1 4.6 5" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const { acc, screen, detailId, setScreen } = useSenpai();
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 65,
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        alignItems: "start",
        padding: "8px 8px max(calc(env(safe-area-inset-bottom, 0px) - 12px), 8px)",
        background: "linear-gradient(0deg,#0a0c0f 74%,transparent)",
        borderTop: "1px solid rgba(255,255,255,.05)",
      }}
    >
      {items.map((it) => {
        const color = screen === it.key && !detailId ? acc : "#5f6773";
        return (
          <div
            key={it.key}
            onClick={() => setScreen(it.key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            {it.icon(color)}
            <span style={{ fontSize: 9.5, fontWeight: 700, color }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}
