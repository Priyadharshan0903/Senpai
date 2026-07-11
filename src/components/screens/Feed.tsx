"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSenpai } from "@/store";
import { CoverArt } from "@/components/CoverArt";
import { Avatar, PlusIcon } from "@/components/bits";
import { avg, buildEmotes, resolvePerson, MOOD_META, moodBgOf } from "@/lib/derive";
import { GENRE_FILTERS } from "@/lib/theme";

/* eslint-disable @next/next/no-img-element */
const COVER_H = 150; // compact density default

export function Feed() {
  const {
    acc,
    data,
    me,
    genreFilter,
    setGenreFilter,
    setScreen,
    openDetail,
    reactEmote,
    toggleFavorite,
    refresh,
  } = useSenpai();
  const profiles = data?.profiles ?? [];
  const meP = data && me ? resolvePerson(profiles, me) : null;

  const filtered = (data?.entries ?? []).filter(
    (e) => genreFilter === "All" || e.genres.includes(genreFilter)
  );

  // ── infinite scroll: render cards in batches; the sentinel row loads the next batch
  const BATCH = 8;
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // start over from the first batch whenever the genre filter changes
  const [prevFilter, setPrevFilter] = useState(genreFilter);
  if (prevFilter !== genreFilter) {
    setPrevFilter(genreFilter);
    setVisibleCount(BATCH);
  }
  const hasMore = visibleCount < filtered.length;
  useEffect(() => {
    const root = scrollerRef.current;
    const node = sentinelRef.current;
    if (!root || !node || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setVisibleCount((v) => v + BATCH),
      { root, rootMargin: "400px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore]);

  // ── pull-to-refresh: drag down from the top of the list to reload
  const PULL_TRIGGER = 70;
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const startY = useRef<number | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const setP = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };
    const onStart = (e: TouchEvent) => {
      startY.current = !busy.current && el.scrollTop <= 0 ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && el.scrollTop <= 0) {
        e.preventDefault(); // take over from the native rubber-band
        setDragging(true);
        setP(Math.min(dy * 0.45, 110));
      } else if (pullRef.current > 0) {
        setDragging(false);
        setP(0);
      }
    };
    const onEnd = async () => {
      if (startY.current == null) return;
      startY.current = null;
      setDragging(false);
      if (pullRef.current >= PULL_TRIGGER) {
        busy.current = true;
        setRefreshing(true);
        setP(54); // park the spinner while the reload runs
        try {
          await refresh();
        } finally {
          busy.current = false;
          setRefreshing(false);
          setP(0);
        }
      } else {
        setP(0);
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [refresh]);

  if (!data) return null;
  const shown = filtered.slice(0, visibleCount);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* ===== pinned header: crew label + Latest logs + actions ===== */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px 10px",
          zIndex: 5,
        }}
      >
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

      {/* ===== scrollable middle: genre chips + cards ===== */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {/* pull-to-refresh spinner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 6,
            pointerEvents: "none",
            transform: `translateY(${pull - 44}px)`,
            opacity: Math.min(pull / PULL_TRIGGER, 1),
            transition: dragging ? "none" : "transform .25s ease, opacity .25s ease",
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#12161c", boxShadow: "0 4px 14px rgba(0,0,0,.5), inset 0 0 0 1.5px rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={acc}
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{
                animation: refreshing ? "cnSpin .7s linear infinite" : "none",
                transform: refreshing ? undefined : `rotate(${pull * 2.4}deg)`,
              }}
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
            </svg>
          </div>
        </div>

        <div
          ref={scrollerRef}
          style={{ height: "100%", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          <div style={{ paddingBottom: 24, transform: `translateY(${pull}px)`, transition: dragging ? "none" : "transform .25s ease" }}>
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
          {shown.map((e) => {
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
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 7 }}>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); toggleFavorite(e.id); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: e.favs.includes(me || "") ? "rgba(255,111,97,.18)" : "rgba(8,10,13,.62)", backdropFilter: "blur(8px)", transition: "transform .1s" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={e.favs.includes(me || "") ? "#ff6f61" : "none"} stroke={e.favs.includes(me || "") ? "#ff6f61" : "rgba(255,255,255,.75)"} strokeWidth={2.2} strokeLinejoin="round"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.6 4.5 6.4 4.5c2.2 0 3.9 1.2 5.6 3.4 1.7-2.2 3.4-3.4 5.6-3.4 3.8 0 6 3.9 4.4 7.2C19.5 16.4 12 21 12 21z" /></svg>
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 20, background: "rgba(8,10,13,.62)", backdropFilter: "blur(8px)", color: acc, fontWeight: 800, fontSize: 14, pointerEvents: "none" }}>
                      <span>★</span>
                      <span className="mono">{avg(e).toFixed(1)}</span>
                    </div>
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
                  {w0.reflect.trim() && (
                    <div className="clamp2" style={{ fontSize: 14, lineHeight: 1.55, color: "#c6ccd4", marginBottom: 14 }}>
                      {w0.reflect}
                    </div>
                  )}

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
          {hasMore && (
            <div ref={sentinelRef} style={{ display: "flex", justifyContent: "center", padding: "20px 0 8px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={acc} strokeWidth={2.5} strokeLinecap="round" style={{ animation: "cnSpin .7s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-3-6.7" />
              </svg>
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#5a636f", fontSize: 13, padding: "40px 20px" }}>
              No logs in <b style={{ color: "#9aa3af" }}>{genreFilter}</b> yet.
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
