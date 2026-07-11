"use client";

import React, { useState } from "react";
import { useSenpai } from "@/store";
import { createProfile } from "@/lib/api";
import { avatarUrl } from "@/lib/avatar";
import styles from "./AddProfile.module.css";

/* eslint-disable @next/next/no-img-element */
export function AddProfile() {
  const { acc, switchProfile, enterApp, refresh, flash } = useSenpai();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = avatarUrl(name.trim() || "new-profile");

  const create = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      const p = await createProfile(n);
      await refresh();
      enterApp((p as { id: string }).id);
    } catch (e) {
      flash(e instanceof Error ? e.message : "could not create profile");
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.screen} absolute-fill flex-col`}>
      <button onClick={switchProfile} className={`${styles.backBtn} flex-center pointer`}>
        ‹
      </button>
      <div className="flex-1 flex-col justify-center">
        <div className={`${styles.logoTile} flex-center relative`}>
          <div className={`${styles.logoMark} relative`}>
            <span className={styles.cardLeft} />
            <span className={styles.cardRight} />
            <span className={`${styles.cardCenter} flex-center`} style={{ background: acc }}>
              <span className={styles.star}>★</span>
            </span>
          </div>
        </div>
        <div className={styles.heading}>
          Add your profile
        </div>
        <div className={styles.sub}>
          Join the crew — pick a name and you&apos;re in. Your avatar is generated for you.
        </div>
        <div className={`${styles.nameRow} flex items-center gap-12`}>
          <span className={`${styles.avatar} avatar-round flex-none`} style={{ background: acc }}>
            <img src={preview} alt="" className="img-cover" />
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="your name"
            className={`${styles.nameInput} flex-1`}
          />
        </div>
      </div>
      <button
        onClick={create}
        className={`${styles.createBtn} w-full pointer`}
        style={{ background: acc, opacity: busy ? 0.7 : 1 }}
      >
        Create profile &amp; enter
      </button>
    </div>
  );
}
