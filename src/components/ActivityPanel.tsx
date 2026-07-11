"use client";

import React, { useState } from "react";
import { useSenpai } from "@/store";
import { Avatar } from "@/components/bits";
import { resolvePerson, timeAgo } from "@/lib/derive";
import { ActivityEvent } from "@/lib/types";

/* eslint-disable @next/next/no-img-element */

function eventLine(ev: ActivityEvent, name: string): React.ReactNode {
  const b = (s: string) => <b style={{ color: "#f3f5f8" }}>{s}</b>;
  switch (ev.type) {
    case "log":
      return (
        <>
          {b(name)} logged {b(ev.title)}
          {typeof ev.rating === "number" && (
            <span style={{ color: "#8a929e" }}> · ★ {ev.rating.toFixed(1)}</span>
          )}
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
          {ev.status === "Watching" && <span style={{ color: "#8a929e" }}> · watching</span>}
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
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 70,
        background: "#0a0c0f",
        display: "flex",
        flexDirection: "column",
        animation: "cnSlide .25s ease",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* header */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px 12px",
        }}
      >
        <div>
          <div className="mono" style={{ fontSize: 10, color: acc, letterSpacing: "1.5px" }}>
            THE CREW
          </div>
          <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: "-.8px", color: "#f3f5f8", marginTop: 2 }}>
            Activity
          </div>
        </div>
        <button
          onClick={closeActivity}
          aria-label="Close activity"
          style={{ width: 40, height: 40, borderRadius: 13, border: "none", cursor: "pointer", background: "#12161c", color: "#9aa3af", fontSize: 18, fontWeight: 700 }}
        >
          ✕
        </button>
      </div>

      {/* events */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", padding: "0 14px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        {activity.length === 0 && (
          <div style={{ textAlign: "center", color: "#5a636f", fontSize: 13, padding: "60px 20px", lineHeight: 1.6 }}>
            Nothing yet — when the crew logs shows, reacts, or updates
            watchlists, it lands here.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                style={{
                  display: "flex",
                  gap: 11,
                  alignItems: "flex-start",
                  padding: "12px 12px",
                  borderRadius: 16,
                  background: "#12161c",
                  boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.05)",
                  cursor: ev.entryId ? "pointer" : "default",
                }}
              >
                <div style={{ position: "relative", flex: "none" }}>
                  <Avatar src={person.avatar} bg={person.color} size={34} />
                  {fresh && (
                    <span style={{ position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: acc, boxShadow: "0 0 0 2px #12161c" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.45, color: "#c6ccd4" }}>
                    {eventLine(ev, person.name)}
                  </div>
                  {quote && (
                    <div className="clamp2" style={{ fontSize: 12.5, lineHeight: 1.5, color: "#8a929e", marginTop: 4 }}>
                      “{quote}”
                    </div>
                  )}
                  <div className="mono" style={{ fontSize: 10, color: "#5f6773", marginTop: 5 }}>
                    {timeAgo(ev.at)}
                  </div>
                </div>
                <div
                  style={{
                    flex: "none",
                    width: 38,
                    height: 50,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: `linear-gradient(155deg,${ev.c1},${ev.c2})`,
                  }}
                >
                  {ev.cover && (
                    <img src={ev.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
