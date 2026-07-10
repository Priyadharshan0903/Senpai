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
    key: "platforms",
    label: "Platforms",
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
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
        height: 80,
        zIndex: 65,
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        alignItems: "start",
        padding: "14px 8px 0",
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
