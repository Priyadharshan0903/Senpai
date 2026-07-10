"use client";

import React from "react";
import { useCanon } from "@/store";
import { resolvePerson, MOOD_META, moodBgOf } from "@/lib/derive";
import { rewatchLabel } from "@/lib/theme";

/* eslint-disable @next/next/no-img-element */
export function Profile() {
  const { acc, data, me, switchProfile, openDetail } = useCanon();
  if (!data || !me) return null;
  const meP = resolvePerson(data.profiles, me);

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
    <div style={{ padding: "8px 18px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div style={{ width: 62, height: 62, borderRadius: "50%", overflow: "hidden", background: acc, display: "block" }}>
          <img src={meP.avatar} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 23, color: "#f3f5f8", letterSpacing: "-.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meP.name}</div>
          <div className="mono" style={{ fontSize: 11, color: "#8a929e", marginTop: 3 }}>member of the crew</div>
        </div>
        <button onClick={switchProfile} style={{ flex: "none", padding: "0 14px", height: 38, borderRadius: 12, border: "1.5px solid rgba(255,255,255,.14)", background: "transparent", color: "#c6ccd4", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Switch</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ flex: 1, padding: "15px 10px", borderRadius: 15, textAlign: "center", background: "#12161c", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)" }}>
            <div style={{ fontWeight: 800, fontSize: 24, color: s.color }}>{s.value}</div>
            <div className="mono" style={{ fontSize: 9, color: "#8a929e", letterSpacing: ".5px", marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 10, color: "#8a929e", letterSpacing: "1.5px", marginBottom: 13 }}>YOUR MOODS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
        {moodStats.map((m) => (
          <div key={m.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
              <span style={{ color: m.color, fontWeight: 700 }}>{m.name}</span>
              <span className="mono" style={{ color: "#8a929e", fontSize: 11 }}>{m.count}</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: "#181c22", overflow: "hidden" }}>
              <div style={{ height: "100%", width: m.pct + "%", borderRadius: 4, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 10, color: "#8a929e", letterSpacing: "1.5px", marginBottom: 13 }}>YOUR LOGS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {myWatches.map((x, idx) => {
          const mc = MOOD_META[x.w.mood] || "#8a929e";
          return (
            <div key={idx} onClick={() => openDetail(x.e.id)} style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, borderRadius: 14, background: "#12161c", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)", cursor: "pointer" }}>
              <div style={{ width: 42, height: 56, borderRadius: 7, flex: "none", background: `linear-gradient(155deg,${x.e.c1},${x.e.c2})`, position: "relative", overflow: "hidden" }}>
                {x.e.cover && <img src={x.e.cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#f3f5f8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.e.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                  <span style={{ padding: "3px 9px", borderRadius: 13, fontSize: 10.5, fontWeight: 700, background: moodBgOf(mc), color: mc }}>{x.w.mood}</span>
                  {x.w.rewatch > 0 && (
                    <span style={{ padding: "3px 9px", borderRadius: 13, fontSize: 10.5, fontWeight: 700, background: "rgba(255,255,255,.06)", color: "#c6ccd4" }}>↻ {rewatchLabel(x.w.rewatch)}</span>
                  )}
                </div>
              </div>
              <div style={{ flex: "none", color: acc, fontWeight: 800, fontSize: 15 }}>★ {x.w.rating.toFixed(1)}</div>
            </div>
          );
        })}
        {myWatches.length === 0 && (
          <div style={{ textAlign: "center", color: "#4a525d", fontSize: 13, padding: 24 }}>Nothing logged yet — tap + to add your first show.</div>
        )}
      </div>
    </div>
  );
}
