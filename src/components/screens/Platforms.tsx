"use client";

import React from "react";
import { useCanon } from "@/store";
import { PlusIcon } from "@/components/bits";
import { avg, resolvePerson } from "@/lib/derive";
import { PLATFORM_LIST, PLATFORM_META } from "@/lib/theme";

/* eslint-disable @next/next/no-img-element */
export function Platforms() {
  const { acc, data, setScreen, openDetail } = useCanon();
  if (!data) return null;

  const sections = PLATFORM_LIST.map((p) => {
    const shows = data.entries
      .filter((e) => e.watches.some((w) => w.platform === p))
      .map((e) => {
        const who = e.watches
          .filter((w) => w.platform === p)
          .map((w) => resolvePerson(data.profiles, w.user).name);
        const byLabel = who.length === 1 ? who[0] : who.length + " watched here";
        return { e, byLabel };
      });
    return { name: p, color: PLATFORM_META[p], count: shows.length, shows };
  }).filter((s) => s.shows.length > 0);

  return (
    <div style={{ padding: "8px 0 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6, padding: "0 18px" }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: acc, letterSpacing: "1.5px" }}>WHERE THE CREW WATCHES</div>
          <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: "-.8px", color: "#f3f5f8", marginTop: 2 }}>By platform</div>
        </div>
        <button onClick={() => setScreen("add")} style={{ width: 38, height: 38, borderRadius: 12, border: "none", cursor: "pointer", background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PlusIcon stroke="#0a0c0f" size={19} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 16 }}>
        {sections.map((p) => (
          <div key={p.name}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 18px", marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
              <span style={{ fontWeight: 800, fontSize: 16, color: "#f3f5f8" }}>{p.name}</span>
              <span className="mono" style={{ fontSize: 11, color: "#8a929e" }}>{p.count}</span>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 18px 4px" }}>
              {p.shows.map(({ e, byLabel }) => (
                <div key={e.id} onClick={() => openDetail(e.id)} style={{ width: 110, flex: "none", cursor: "pointer" }}>
                  <div style={{ height: 148, borderRadius: 12, overflow: "hidden", background: `linear-gradient(155deg,${e.c1},${e.c2})`, position: "relative", boxShadow: "0 6px 16px rgba(0,0,0,.4)" }}>
                    {e.cover && <img src={e.cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 14, background: "rgba(8,10,13,.62)", backdropFilter: "blur(6px)", color: acc, fontWeight: 800, fontSize: 11 }}>
                      <span style={{ fontSize: 10 }}>★</span>
                      <span className="mono">{avg(e).toFixed(1)}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: "#e7eaef", marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: "#8a929e", marginTop: 1 }}>{byLabel}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div style={{ textAlign: "center", color: "#5a636f", fontSize: 13, padding: "40px 20px" }}>Nothing logged yet.</div>
        )}
      </div>
    </div>
  );
}
