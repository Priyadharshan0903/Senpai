"use client";

import React from "react";
import { useSenpai } from "@/store";
import { LogoMark } from "@/components/bits";
import styles from "./Picker.module.css";

/* eslint-disable @next/next/no-img-element */
export function Picker() {
  const { acc, data, selectProfile, openAddProfile } = useSenpai();
  const profiles = data?.profiles || [];

  return (
    <div className={`${styles.screen} absolute-fill scroll-y`}>
      <div className={`${styles.inner} flex-col items-center`}>
        <LogoMark acc={acc} size={76} />
        <div className={styles.wordmark}>Senpai</div>
        <div className={styles.tagline}>the shared anime journal</div>
        <div className={styles.prompt}>Who&apos;s watching?</div>
        <div className={`${styles.grid} w-full`}>
          {profiles.map((p) => (
            <div key={p.id} onClick={() => selectProfile(p.id)} className={`${styles.tile} flex-col items-center pointer`}>
              <div className={`${styles.tileAvatar} overflow-hidden`} style={{ background: p.color }}>
                <img src={p.avatar} alt="" className="img-cover" />
              </div>
              <span className={styles.tileName}>{p.name}</span>
            </div>
          ))}
          <div onClick={openAddProfile} className={`${styles.tile} flex-col items-center pointer`}>
            <div className={`${styles.addBox} flex-center`}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#5f6773" strokeWidth={2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span className={styles.addLabel}>Add profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
