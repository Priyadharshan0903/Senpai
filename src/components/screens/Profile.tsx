"use client";

import React, { useState } from "react";
import { useSenpai } from "@/store";
import { resolvePerson, MOOD_META, moodBgOf } from "@/lib/derive";
import { rewatchLabel } from "@/lib/theme";
import { updateProfile } from "@/lib/api";
import { avatarUrl } from "@/lib/avatar";
import { RenderWhen } from "@/components/RenderWhen";
import styles from "./Profile.module.css";

/* eslint-disable @next/next/no-img-element */

function randomSeeds(base: string, n: number): string[] {
  return Array.from({ length: n }, () => base + "-" + Math.random().toString(36).slice(2, 8));
}

export function Profile() {
  const { acc, data, me, switchProfile, openDetail, refresh, flash } = useSenpai();
  const [picking, setPicking] = useState(false);
  const [seeds, setSeeds] = useState<string[]>([]);
  const [savingSeed, setSavingSeed] = useState<string | null>(null);
  if (!data || !me) return null;
  const meP = resolvePerson(data.profiles, me);

  const openPicker = () => {
    setSeeds([meP.name, ...randomSeeds(meP.name, 7)]);
    setPicking(true);
  };

  const pickSeed = async (seed: string) => {
    if (savingSeed) return;
    setSavingSeed(seed);
    try {
      await updateProfile({ id: me, avatarSeed: seed });
      await refresh();
      setPicking(false);
      flash("Profile picture updated");
    } catch (e) {
      flash(e instanceof Error ? e.message : "could not update");
    } finally {
      setSavingSeed(null);
    }
  };

  const myWatches: { e: (typeof data.entries)[number]; w: (typeof data.entries)[number]["watches"][number] }[] = [];
  data.entries.forEach((e) => e.watches.forEach((w) => { if (w.user === me) myWatches.push({ e, w }); }));

  const myAvg = myWatches.length
    ? (myWatches.reduce((a, x) => a + x.w.rating, 0) / myWatches.length).toFixed(1)
    : "—";
  const rewatchTotal = myWatches.reduce((a, x) => a + (x.w.rewatch || 0), 0);

  const stats = [
    { value: myWatches.length, label: "LOGGED", color: acc },
    { value: myAvg, label: "AVG RATING", color: "#57c99a" },
    { value: rewatchTotal, label: "REWATCHES", color: "#5b8cc9" },
  ];

  const moodCount: Record<string, number> = {};
  myWatches.forEach((x) => (moodCount[x.w.mood] = (moodCount[x.w.mood] || 0) + 1));
  const mMax = Math.max(1, ...Object.values(moodCount));
  const moodStats = Object.entries(moodCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: Math.round((count / mMax) * 100), color: MOOD_META[name] || "#8a929e" }));

  return (
    <div className={styles.screen}>
      <div className={`${styles.header} flex items-center`} style={{ marginBottom: picking ? 14 : 22 }}>
        <div onClick={openPicker} className={`${styles.avatarWrap} relative flex-none pointer`}>
          <div className={`${styles.avatar} avatar-round`} style={{ background: acc }}>
            <img src={meP.avatar} alt="" className="img-cover" />
          </div>
          <span className={`${styles.editBadge} flex-center`}>✎</span>
        </div>
        <div className="flex-1 minw-0">
          <div className={`${styles.name} ${styles.ellipsis}`}>{meP.name}</div>
          <div className={`${styles.memberLine} mono`}>member of the crew</div>
        </div>
        <button onClick={switchProfile} className={`${styles.switchBtn} flex-none pointer`}>Switch</button>
      </div>

      {/* avatar picker */}
      <RenderWhen.If isTrue={picking}>
        <div className={styles.pickerPanel} style={{ boxShadow: `inset 0 0 0 1.5px ${acc}44` }}>
          <div className={`${styles.pickerHead} flex items-center`}>
            <span className={`${styles.pickerLabel} mono flex-1`}>PICK A NEW LOOK</span>
            <button onClick={() => setSeeds([meP.name, ...randomSeeds(meP.name, 7)])} className={`${styles.shuffleBtn} pointer`}>↻ Shuffle</button>
            <button onClick={() => setPicking(false)} className={`${styles.closeBtn} pointer`}>Close</button>
          </div>
          <div className={styles.seedGrid}>
            {seeds.map((s) => (
              <div key={s} onClick={() => pickSeed(s)} className="pointer" style={{ opacity: savingSeed && savingSeed !== s ? 0.5 : 1 }}>
                <div className={`${styles.seedAvatar} avatar-round w-full`} style={{ boxShadow: savingSeed === s ? `0 0 0 2px ${acc}` : "inset 0 0 0 1px rgba(255,255,255,.08)" }}>
                  <img src={avatarUrl(s)} alt="" className="img-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </RenderWhen.If>

      <div className={`${styles.statsRow} flex gap-10`}>
        {stats.map((s) => (
          <div key={s.label} className={`${styles.statCard} flex-1 text-center`}>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
            <div className={`${styles.statLabel} mono`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={`${styles.sectionLabel} mono`}>YOUR MOODS</div>
      <div className={`${styles.moodList} flex-col gap-10`}>
        {moodStats.map((m) => (
          <div key={m.name}>
            <div className={`${styles.moodHead} flex justify-between`}>
              <span className={styles.moodName} style={{ color: m.color }}>{m.name}</span>
              <span className={`${styles.moodCount} mono`}>{m.count}</span>
            </div>
            <div className={`${styles.barTrack} overflow-hidden`}>
              <div className={styles.barFill} style={{ width: m.pct + "%", background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className={`${styles.sectionLabel} mono`}>YOUR LOGS</div>
      <div className="flex-col gap-10">
        {myWatches.map((x, idx) => {
          const mc = MOOD_META[x.w.mood] || "#8a929e";
          return (
            <div key={idx} onClick={() => openDetail(x.e.id)} className={`${styles.logRow} flex items-center gap-12 pointer`}>
              <div className={`${styles.logCover} flex-none relative overflow-hidden`} style={{ background: `linear-gradient(155deg,${x.e.c1},${x.e.c2})` }}>
                <RenderWhen.If isTrue={!!x.e.cover}>
                  <img src={x.e.cover} alt="" className="absolute-fill img-cover" />
                </RenderWhen.If>
              </div>
              <div className="flex-1 minw-0">
                <div className={`${styles.logTitle} ${styles.ellipsis}`}>{x.e.title}</div>
                <div className={`${styles.tagRow} flex gap-6`}>
                  <span className={styles.pill} style={{ background: moodBgOf(mc), color: mc }}>{x.w.mood}</span>
                  <RenderWhen.If isTrue={x.w.rewatch > 0}>
                    <span className={styles.rewatchPill}>↻ {rewatchLabel(x.w.rewatch)}</span>
                  </RenderWhen.If>
                </div>
              </div>
              <div className={`${styles.logRating} flex-none`} style={{ color: acc }}>★ {x.w.rating.toFixed(1)}</div>
            </div>
          );
        })}
        <RenderWhen.If isTrue={myWatches.length === 0}>
          <div className={`${styles.empty} text-center`}>Nothing logged yet — tap + to add your first show.</div>
        </RenderWhen.If>
      </div>
    </div>
  );
}
