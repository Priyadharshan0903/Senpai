"use client";

import React from "react";
import { useSenpai } from "@/store";
import { PlusIcon } from "@/components/bits";
import { avg, MOOD_META, moodBgOf } from "@/lib/derive";

/* eslint-disable @next/next/no-img-element */
export function Ranked() {
  const { acc, data, setScreen, openDetail } = useSenpai();
  if (!data) return null;

  const ranked = [...data.entries].sort((a, b) => avg(b) - avg(a));

  return (
    <div style={{ padding: "8px 18px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: acc, letterSpacing: "1.5px" }}>BY CREW AVERAGE</div>
          <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: "-.8px", color: "#f3f5f8", marginTop: 2 }}>The ranking</div>
        </div>
        <button onClick={() => setScreen("add")} style={{ width: 38, height: 38, borderRadius: 12, border: "none", cursor: "pointer", background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PlusIcon stroke="#0a0c0f" size={19} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              style={{ display: "flex", alignItems: "center", gap: 13, padding: 10, borderRadius: 15, background: "#12161c", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)", cursor: "pointer" }}
            >
              <span className="mono" style={{ flex: "none", width: 26, textAlign: "center", fontWeight: 700, fontSize: 17, color: rankColor }}>{i + 1}</span>
              <div style={{ width: 46, height: 60, borderRadius: 8, flex: "none", background: `linear-gradient(155deg,${e.c1},${e.c2})`, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)", position: "relative", overflow: "hidden" }}>
                {e.cover && <img src={e.cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#f3f5f8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  <span style={{ padding: "3px 9px", borderRadius: 14, fontSize: 10.5, fontWeight: 700, background: moodBgOf(mc), color: mc }}>{topMood}</span>
                  <span style={{ fontSize: 11.5, color: "#8a929e" }}>{e.watches.length} logged</span>
                </div>
              </div>
              <div style={{ flex: "none", textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: acc, fontWeight: 800, fontSize: 17 }}>
                  <span style={{ fontSize: 13 }}>★</span>
                  <span className="mono">{avg(e).toFixed(1)}</span>
                </div>
                <div className="mono" style={{ fontSize: 9.5, color: "#5a636f", marginTop: 2 }}>avg /10</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
