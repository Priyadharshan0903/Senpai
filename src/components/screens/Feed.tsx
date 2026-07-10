"use client";

import React from "react";
import { useCanon } from "@/store";
import { CoverArt } from "@/components/CoverArt";
import { Avatar, PlusIcon } from "@/components/bits";
import { avg, buildEmotes, resolvePerson, MOOD_META, moodBgOf } from "@/lib/derive";
import { GENRE_FILTERS } from "@/lib/theme";

/* eslint-disable @next/next/no-img-element */
const COVER_H = 150; // compact density default

export function Feed() {
  const { acc, data, me, genreFilter, setGenreFilter, setScreen, openDetail, reactEmote } =
    useCanon();
  if (!data) return null;
  const profiles = data.profiles;
  const meP = me ? resolvePerson(profiles, me) : null;

  const filtered = data.entries.filter(
    (e) => genreFilter === "All" || e.genres.includes(genreFilter)
  );

  return (
    <div style={{ padding: "6px 0 24px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 12px" }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: acc, letterSpacing: "1.5px" }}>
            THE CREW · {profiles.length} PROFILES
          </div>
          <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: "-.8px", color: "#f3f5f8", marginTop: 2 }}>
            Latest logs
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setScreen("add")}
            style={{ width: 40, height: 40, borderRadius: 13, border: "none", cursor: "pointer", background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <PlusIcon stroke="#0a0c0f" />
          </button>
          <div
            onClick={() => setScreen("profile")}
            style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: acc, cursor: "pointer", display: "block" }}
          >
            {meP && <img src={meP.avatar} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />}
          </div>
        </div>
      </div>

      {/* genre filters */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 18px 14px" }}>
        {GENRE_FILTERS.map((g) => {
          const on = genreFilter === g;
          return (
            <button
              key={g}
              onClick={() => setGenreFilter(g)}
              style={{
                flex: "none",
                padding: "7px 15px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12.5,
                background: on ? acc : "#12161c",
                color: on ? "#0a0c0f" : "#9aa3af",
              }}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 16px" }}>
        {filtered.map((e) => {
          const w0 = e.watches[0];
          const adder = resolvePerson(profiles, w0.user);
          const mc = MOOD_META[w0.mood] || "#8a929e";
          const watchers = e.watches.slice(0, 4).map((w) => resolvePerson(profiles, w.user));
          const emotes = buildEmotes(e, acc, 3);
          return (
            <div
              key={e.id}
              style={{
                borderRadius: 20,
                overflow: "hidden",
                background: "#12161c",
                boxShadow: "0 8px 26px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(255,255,255,.05)",
                animation: "cnUp .35s ease both",
              }}
            >
              {/* artwork */}
              <div style={{ position: "relative", height: COVER_H, background: `linear-gradient(155deg,${e.c1},${e.c2})` }}>
                <CoverArt src={e.cover} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(10,12,15,.96) 4%,rgba(10,12,15,.34) 42%,transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 20, background: "rgba(8,10,13,.62)", backdropFilter: "blur(8px)", color: acc, fontWeight: 800, fontSize: 14, pointerEvents: "none" }}>
                  <span>★</span>
                  <span className="mono">{avg(e).toFixed(1)}</span>
                </div>
                <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, pointerEvents: "none" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {e.genres.slice(0, 3).map((gc) => (
                      <span key={gc} style={{ padding: "3px 9px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,.16)", color: "#e7eaef", backdropFilter: "blur(4px)" }}>
                        {gc}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 23, letterSpacing: "-.5px", color: "#fff", lineHeight: 1.05 }}>{e.title}</div>
                  <div className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 4 }}>
                    {e.year} · {e.ep}
                  </div>
                </div>
              </div>

              {/* body */}
              <div onClick={() => openDetail(e.id)} style={{ padding: "14px 16px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                  <Avatar src={adder.avatar} bg={adder.color} size={30} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#c6ccd4" }}>
                    <b style={{ color: "#f3f5f8" }}>{adder.name}</b> logged this ·{" "}
                    <span style={{ color: "#8a929e" }}>{e.time}</span>
                  </div>
                  <span style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: moodBgOf(mc), color: mc }}>
                    {w0.mood}
                  </span>
                </div>
                <div className="clamp2" style={{ fontSize: 14, lineHeight: 1.55, color: "#c6ccd4", marginBottom: 14 }}>
                  {w0.reflect}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                      {watchers.map((c, i) => (
                        <span key={i} style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", background: c.color, marginLeft: -7, boxShadow: "0 0 0 2px #12161c", display: "block" }}>
                          <img src={c.avatar} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: "#8a929e" }}>
                      {e.watches.length}
                      {e.watches.length === 1 ? " log" : " logs"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {emotes.map((em) => (
                      <button
                        key={em.emoji}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          reactEmote(e.id, em.emoji);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 16, border: "none", cursor: "pointer", background: em.bg, boxShadow: em.ring, transition: "transform .1s" }}
                      >
                        <span style={{ fontSize: 13 }}>{em.emoji}</span>
                        <span className="mono" style={{ fontSize: 10.5, fontWeight: 500, color: em.fg }}>{em.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#5a636f", fontSize: 13, padding: "40px 20px" }}>
            No logs in <b style={{ color: "#9aa3af" }}>{genreFilter}</b> yet.
          </div>
        )}
      </div>
    </div>
  );
}
