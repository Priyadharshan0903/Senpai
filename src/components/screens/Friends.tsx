"use client";

import React from "react";
import { useSenpai } from "@/store";
import { resolvePerson } from "@/lib/derive";
import styles from "./Friends.module.css";

/* eslint-disable @next/next/no-img-element */
export function Friends() {
  const { acc, data, me, setScreen, switchProfile, viewUserList } = useSenpai();
  if (!data || !me) return null;
  const meP = resolvePerson(data.profiles, me);

  const friends = data.profiles
    .filter((p) => p.id !== me)
    .map((p) => {
      const logged = data.entries.filter((e) => e.watches.some((w) => w.user === p.id)).length;
      const listed = data.watchlist.filter((w) => w.user === p.id).length;
      return { ...p, loggedLabel: logged + " logged · " + listed + " on watchlist" };
    });

  return (
    <div className={styles.screen}>
      <div className="eyebrow" style={{ color: acc }}>YOUR CREW</div>
      <div className={`${styles.title} screen-title`}>Friends</div>

      {/* me card */}
      <div className={`${styles.meCard} flex items-center gap-12`} style={{ boxShadow: `inset 0 0 0 1.5px ${acc}44` }}>
        <div className={`${styles.meAvatar} avatar-round flex-none`} style={{ background: acc }}>
          <img src={meP.avatar} alt="" className="img-cover" />
        </div>
        <div className="flex-1 minw-0">
          <div className={`${styles.meName} ${styles.ellipsis}`}>
            {meP.name} <span className={styles.youTag} style={{ color: acc }}>· you</span>
          </div>
          <div className={styles.subLine}>your profile &amp; ranks</div>
        </div>
        <button onClick={() => setScreen("profile")} className={`${styles.ghostBtn} flex-none pointer`}>Profile</button>
        <button onClick={switchProfile} className={`${styles.accentBtn} flex-none pointer`} style={{ background: acc }}>Switch</button>
      </div>

      <div className={`${styles.sectionLabel} mono`}>THE CREW</div>
      <div className="flex-col gap-10">
        {friends.map((f) => (
          <div key={f.id} className={`${styles.friendRow} flex items-center`}>
            <div className={`${styles.friendAvatar} avatar-round flex-none`} style={{ background: f.color }}>
              <img src={f.avatar} alt="" className="img-cover" />
            </div>
            <div className="flex-1 minw-0">
              <div className={styles.friendName}>{f.name}</div>
              <div className={styles.subLine}>{f.loggedLabel}</div>
            </div>
            <button onClick={() => viewUserList(f.id)} className={`${styles.watchlistBtn} flex-none pointer`}>Watchlist</button>
          </div>
        ))}
      </div>
    </div>
  );
}
