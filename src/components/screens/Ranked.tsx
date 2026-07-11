"use client";

import React from "react";
import { useSenpai } from "@/store";
import { PlusIcon } from "@/components/bits";
import { avg, MOOD_META, moodBgOf } from "@/lib/derive";
import { RenderWhen } from "@/components/RenderWhen";
import styles from "./Ranked.module.css";

/* eslint-disable @next/next/no-img-element */
export function Ranked() {
  const { acc, data, setScreen, openDetail } = useSenpai();
  if (!data) return null;

  const ranked = [...data.entries].sort((a, b) => avg(b) - avg(a));

  return (
    <div className={styles.screen}>
      <div className={`${styles.header} flex justify-between`}>
        <div>
          <div className="eyebrow" style={{ color: acc }}>BY CREW AVERAGE</div>
          <div className={`${styles.title} screen-title`}>The ranking</div>
        </div>
        <button onClick={() => setScreen("add")} className={`${styles.addBtn} flex-center pointer`} style={{ background: acc }}>
          <PlusIcon stroke="#0a0c0f" size={19} />
        </button>
      </div>

      <div className="flex-col gap-10">
        {ranked.map((e, i) => {
          const moods: Record<string, number> = {};
          e.watches.forEach((w) => (moods[w.mood] = (moods[w.mood] || 0) + 1));
          const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mid";
          const mc = MOOD_META[topMood] || "#8a929e";
          const rankColor = i === 0 ? acc : i < 3 ? "#c6ccd4" : "#5a636f";
          return (
            <div
              key={e.id}
              onClick={() => openDetail(e.id)}
              className={`${styles.row} flex items-center pointer`}
            >
              <span className={`${styles.rank} mono flex-none text-center`} style={{ color: rankColor }}>{i + 1}</span>
              <div className={`${styles.cover} flex-none relative overflow-hidden`} style={{ background: `linear-gradient(155deg,${e.c1},${e.c2})` }}>
                <RenderWhen.If isTrue={!!e.cover}>
                  <img src={e.cover} alt="" className="absolute-fill img-cover" />
                </RenderWhen.If>
              </div>
              <div className="flex-1 minw-0">
                <div className={`${styles.rowTitle} ${styles.ellipsis}`}>{e.title}</div>
                <div className={`${styles.meta} flex items-center gap-8`}>
                  <span className={styles.moodPill} style={{ background: moodBgOf(mc), color: mc }}>{topMood}</span>
                  <span className={styles.loggedCount}>{e.watches.length} logged</span>
                </div>
              </div>
              <div className={`${styles.score} flex-none`}>
                <div className={`${styles.scoreValue} flex items-center gap-4`} style={{ color: acc }}>
                  <span className={styles.star}>★</span>
                  <span className="mono">{avg(e).toFixed(1)}</span>
                </div>
                <div className={`${styles.avgLabel} mono`}>avg /10</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
