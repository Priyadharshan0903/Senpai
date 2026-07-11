"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSenpai } from "@/store";
import { CoverArt } from "@/components/CoverArt";
import { Avatar, PlusIcon } from "@/components/bits";
import { RenderWhen } from "@/components/RenderWhen";
import { avg, buildEmotes, resolvePerson, MOOD_META, moodBgOf } from "@/lib/derive";
import { GENRE_FILTERS } from "@/lib/theme";
import styles from "./Feed.module.css";

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
    unread,
    openActivity,
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
    <div className="h-full flex-col">
      {/* ===== pinned header: crew label + Latest logs + actions ===== */}
      <div className={`${styles.header} flex-none flex items-center justify-between`}>
        <div>
          <div className="eyebrow" style={{ color: acc }}>
            THE CREW · {profiles.length} PROFILES
          </div>
          <div className={`screen-title ${styles.title}`}>Latest logs</div>
        </div>
        <div className="flex items-center gap-10">
          <button
            onClick={openActivity}
            aria-label="Crew activity"
            className={`${styles.bellBtn} icon-btn relative`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9aa3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <RenderWhen.If isTrue={unread > 0}>
              <span className={`${styles.badge} flex-center`} style={{ background: acc }}>
                {unread > 9 ? "9+" : unread}
              </span>
            </RenderWhen.If>
          </button>
          <button onClick={() => setScreen("add")} className="icon-btn" style={{ background: acc }}>
            <PlusIcon stroke="#0a0c0f" />
          </button>
          <div
            onClick={() => setScreen("profile")}
            className={`${styles.avatarBtn} avatar-round pointer`}
            style={{ background: acc }}
          >
            <RenderWhen.If isTrue={!!meP}>
              <img src={meP?.avatar} alt="" className="img-cover" />
            </RenderWhen.If>
          </div>
        </div>
      </div>

      {/* ===== scrollable middle: genre chips + cards ===== */}
      <div className={`${styles.middle} flex-1 relative`}>
        {/* pull-to-refresh spinner */}
        <div
          className={`${styles.pullSpinner} flex justify-center`}
          style={{
            transform: `translateY(${pull - 44}px)`,
            opacity: Math.min(pull / PULL_TRIGGER, 1),
            transition: dragging ? "none" : "transform .25s ease, opacity .25s ease",
          }}
        >
          <div className={`${styles.spinnerDisc} flex-center`}>
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

        <div ref={scrollerRef} className="h-full scroll-y">
          <div
            className={styles.pullContent}
            style={{ transform: `translateY(${pull}px)`, transition: dragging ? "none" : "transform .25s ease" }}
          >
        {/* genre filters */}
        <div className={`${styles.chips} flex gap-8 scroll-x`}>
          {GENRE_FILTERS.map((g) => {
            const on = genreFilter === g;
            return (
              <button
                key={g}
                onClick={() => setGenreFilter(g)}
                className={`${styles.chip} flex-none`}
                style={{
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
        <div className={`${styles.cards} flex-col gap-16`}>
          {shown.map((e) => {
            const w0 = e.watches[0];
            const adder = resolvePerson(profiles, w0.user);
            const mc = MOOD_META[w0.mood] || "#8a929e";
            const watchers = e.watches.slice(0, 4).map((w) => resolvePerson(profiles, w.user));
            const emotes = buildEmotes(e, acc, 3);
            return (
              <div key={e.id} className={`card ${styles.cardIn}`}>
                {/* artwork */}
                <div className="relative" style={{ height: COVER_H, background: `linear-gradient(155deg,${e.c1},${e.c2})` }}>
                  <CoverArt src={e.cover} />
                  <div className={`${styles.coverScrim} absolute-fill`} />
                  <div className={`${styles.coverActions} flex items-center`}>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); toggleFavorite(e.id); }}
                      className={`${styles.favBtn} flex-center`}
                      style={{ background: e.favs.includes(me || "") ? "rgba(255,111,97,.18)" : "rgba(8,10,13,.62)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={e.favs.includes(me || "") ? "#ff6f61" : "none"} stroke={e.favs.includes(me || "") ? "#ff6f61" : "rgba(255,255,255,.75)"} strokeWidth={2.2} strokeLinejoin="round"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.6 4.5 6.4 4.5c2.2 0 3.9 1.2 5.6 3.4 1.7-2.2 3.4-3.4 5.6-3.4 3.8 0 6 3.9 4.4 7.2C19.5 16.4 12 21 12 21z" /></svg>
                    </button>
                    <div className={`${styles.ratingPill} flex items-center`} style={{ color: acc }}>
                      <span>★</span>
                      <span className="mono">{avg(e).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className={styles.coverMeta}>
                    <div className={`${styles.genreRow} flex gap-6`}>
                      {e.genres.slice(0, 3).map((gc) => (
                        <span key={gc} className={styles.genreTag}>
                          {gc}
                        </span>
                      ))}
                    </div>
                    <div className={styles.cardTitle}>{e.title}</div>
                    <div className={`mono ${styles.cardSub}`}>
                      {e.year} · {e.ep}
                    </div>
                  </div>
                </div>

                {/* body */}
                <div onClick={() => openDetail(e.id)} className={`${styles.body} pointer`}>
                  <div className={`${styles.byline} flex items-center`}>
                    <Avatar src={adder.avatar} bg={adder.color} size={30} />
                    <div className={`${styles.bylineText} flex-1 minw-0`}>
                      <b className={styles.bylineName}>{adder.name}</b> logged this ·{" "}
                      <span className={styles.timeText}>{e.time}</span>
                    </div>
                    <span className={styles.moodPill} style={{ background: moodBgOf(mc), color: mc }}>
                      {w0.mood}
                    </span>
                  </div>
                  <RenderWhen.If isTrue={!!w0.reflect.trim()}>
                    <div className={`clamp2 ${styles.reflect}`}>{w0.reflect}</div>
                  </RenderWhen.If>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="flex">
                        {watchers.map((c, i) => (
                          <span key={i} className={`${styles.watcher} avatar-round`} style={{ background: c.color }}>
                            <img src={c.avatar} alt="" className="img-cover" />
                          </span>
                        ))}
                      </div>
                      <span className={styles.logCount}>
                        {e.watches.length}
                        {e.watches.length === 1 ? " log" : " logs"}
                      </span>
                    </div>
                    <div className="flex gap-6">
                      {emotes.map((em) => (
                        <button
                          key={em.emoji}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            reactEmote(e.id, em.emoji);
                          }}
                          className={`${styles.emoteBtn} flex items-center gap-4`}
                          style={{ background: em.bg, boxShadow: em.ring }}
                        >
                          <span className={styles.emoteEmoji}>{em.emoji}</span>
                          <span className={`mono ${styles.emoteCount}`} style={{ color: em.fg }}>{em.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <RenderWhen.If isTrue={hasMore}>
            <div ref={sentinelRef} className={`${styles.sentinel} flex justify-center`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={acc} strokeWidth={2.5} strokeLinecap="round" className={styles.spin}>
                <path d="M21 12a9 9 0 1 1-3-6.7" />
              </svg>
            </div>
          </RenderWhen.If>
          <RenderWhen.If isTrue={filtered.length === 0}>
            <div className={`${styles.empty} text-center`}>
              No logs in <b className={styles.emptyGenre}>{genreFilter}</b> yet.
            </div>
          </RenderWhen.If>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
