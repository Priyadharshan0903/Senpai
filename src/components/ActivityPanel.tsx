"use client";

import React, { useState } from "react";
import { useSenpai } from "@/store";
import { Avatar } from "@/components/bits";
import { RenderWhen } from "@/components/RenderWhen";
import { resolvePerson, timeAgo } from "@/lib/derive";
import { ActivityEvent } from "@/lib/types";
import styles from "./ActivityPanel.module.css";

/* eslint-disable @next/next/no-img-element */

function eventLine(ev: ActivityEvent, name: string): React.ReactNode {
  const b = (s: string) => <b className={styles.strong}>{s}</b>;
  switch (ev.type) {
    case "log":
      return (
        <>
          {b(name)} logged {b(ev.title)}
          <RenderWhen.If isTrue={typeof ev.rating === "number"}>
            <span className={styles.dim}> · ★ {ev.rating?.toFixed(1)}</span>
          </RenderWhen.If>
        </>
      );
    case "emote":
      return (
        <>
          {b(name)} reacted {ev.emoji} to {b(ev.title)}
        </>
      );
    case "fact":
      return (
        <>
          {b(name)} dropped a fact on {b(ev.title)}
        </>
      );
    case "watchlist":
      return (
        <>
          {b(name)} added {b(ev.title)} to their watchlist
          <RenderWhen.If isTrue={ev.status === "Watching"}>
            <span className={styles.dim}> · watching</span>
          </RenderWhen.If>
        </>
      );
  }
}

export function ActivityPanel() {
  const { acc, data, me, activity, closeActivity, openDetail } = useSenpai();
  // last-seen mark as it was when the panel opened — rows above it get a dot
  const [seenAtOpen] = useState(() =>
    me && typeof window !== "undefined" ? Number(localStorage.getItem(`senpai.seen.${me}`) || 0) : 0
  );
  const profiles = data?.profiles ?? [];

  return (
    <div className={`${styles.panel} absolute-fill flex-col`}>
      {/* header */}
      <div className={`${styles.header} flex-none flex items-center justify-between`}>
        <div>
          <div className="eyebrow" style={{ color: acc }}>
            THE CREW
          </div>
          <div className={`screen-title ${styles.title}`}>Activity</div>
        </div>
        <button onClick={closeActivity} aria-label="Close activity" className={`icon-btn ${styles.closeBtn}`}>
          ✕
        </button>
      </div>

      {/* events */}
      <div className={`${styles.events} flex-1 scroll-y`}>
        <RenderWhen.If isTrue={activity.length === 0}>
          <div className={`${styles.empty} text-center`}>
            Nothing yet — when the crew logs shows, reacts, or updates
            watchlists, it lands here.
          </div>
        </RenderWhen.If>
        <div className="flex-col gap-8">
          {activity.map((ev) => {
            const person = resolvePerson(profiles, ev.user);
            const fresh = ev.at > seenAtOpen;
            const quote = ev.type === "log" ? ev.reflect : ev.type === "fact" ? ev.text : "";
            return (
              <div
                key={ev.id}
                onClick={() => {
                  if (ev.entryId) {
                    closeActivity();
                    openDetail(ev.entryId);
                  }
                }}
                className={`${styles.row} flex items-start`}
                style={{ cursor: ev.entryId ? "pointer" : "default" }}
              >
                <div className="relative flex-none">
                  <Avatar src={person.avatar} bg={person.color} size={34} />
                  <RenderWhen.If isTrue={fresh}>
                    <span className={styles.freshDot} style={{ background: acc }} />
                  </RenderWhen.If>
                </div>
                <div className="flex-1 minw-0">
                  <div className={styles.line}>{eventLine(ev, person.name)}</div>
                  <RenderWhen.If isTrue={!!quote}>
                    <div className={`clamp2 ${styles.quote}`}>“{quote}”</div>
                  </RenderWhen.If>
                  <div className={`mono ${styles.time}`}>{timeAgo(ev.at)}</div>
                </div>
                <div
                  className={`${styles.thumb} flex-none overflow-hidden`}
                  style={{ background: `linear-gradient(155deg,${ev.c1},${ev.c2})` }}
                >
                  <RenderWhen.If isTrue={!!ev.cover}>
                    <img src={ev.cover} alt="" className="img-cover" />
                  </RenderWhen.If>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
