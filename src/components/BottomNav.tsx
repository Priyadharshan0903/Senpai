"use client";

import React from "react";
import { useSenpai, Screen } from "@/store";
import styles from "./BottomNav.module.css";

const items: { key: Screen; label: string; icon: () => React.ReactNode }[] = [
  {
    key: "feed",
    label: "Feed",
    icon: () => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="6" rx="2" />
        <rect x="4" y="14" width="16" height="6" rx="2" />
      </svg>
    ),
  },
  {
    key: "ranked",
    label: "Ranked",
    icon: () => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 20V10M12 20V4M18 20v-7" />
      </svg>
    ),
  },
  {
    key: "watchlist",
    label: "Watchlist",
    icon: () => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    key: "friends",
    label: "Friends",
    icon: () => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
    <div className={styles.nav}>
      {items.map((it) => {
        // active color is state-driven — icon + label inherit it via currentColor
        const color = screen === it.key && !detailId ? acc : "var(--text-6)";
        return (
          <div key={it.key} onClick={() => setScreen(it.key)} className={styles.item} style={{ color }}>
            {it.icon()}
            <span className={styles.label}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}
