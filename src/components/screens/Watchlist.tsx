"use client";

import React, { useState } from "react";
import { useSenpai } from "@/store";
import { resolvePerson } from "@/lib/derive";
import { PLATFORM_LIST } from "@/lib/theme";
import { setWatchlistStatus, removeFromWatchlist } from "@/lib/api";
import { PlusIcon } from "@/components/bits";
import { RenderWhen } from "@/components/RenderWhen";
import styles from "./Watchlist.module.css";

/* eslint-disable @next/next/no-img-element */

const WL_GENRES = ["All", "Action", "Fantasy", "Drama", "Comedy", "Sci-Fi", "Supernatural", "Adventure"];
const STATUSES = ["All", "Favorites", "Watching", "Plan to watch", "Watched"];

interface Row {
  key: string;
  title: string;
  cover: string;
  c1: string;
  c2: string;
  genres: string[];
  status: "Watching" | "Plan to watch" | "Watched";
  isWatched: boolean;
  favd: boolean;
  rating: string;
  platform: string;
  sub: string;
  user: string;
  itemId?: string; // watchlist doc id (list rows only)
  entryId?: string; // anime id (watched rows / resolved list rows)
}

export function Watchlist() {
  const { acc, data, me, wlUsers, setWlUsers, setScreen, openDetail, refresh, flash } = useSenpai();
  const [status, setStatus] = useState("All");
  const [genre, setGenre] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [open, setOpen] = useState<"genre" | "platform" | null>(null);
  if (!data || !me) return null;

  const effUsers = wlUsers && wlUsers.length ? wlUsers : [me];

  const stColor = (s: string) => (s === "Watching" ? acc : s === "Watched" ? "#57c99a" : "#7c8698");

  // Build rows: watched = real logs; Watching/Plan = watchlist items.
  const rows: Row[] = [];
  for (const uid of effUsers) {
    for (const e of data.entries) {
      const w = e.watches.find((x) => x.user === uid);
      if (w) {
        rows.push({
          key: uid + "|" + e.id,
          title: e.title,
          cover: e.cover,
          c1: e.c1,
          c2: e.c2,
          genres: e.genres,
          status: "Watched",
          isWatched: true,
          favd: e.favs.includes(uid),
          rating: w.rating.toFixed(1),
          platform: w.platform,
          sub: e.genres.slice(0, 2).join(" / ") + " · " + w.platform,
          user: uid,
          entryId: e.id,
        });
      }
    }
    for (const it of data.watchlist.filter((x) => x.user === uid)) {
      const st = it.status === "Watching" ? "Watching" : "Plan to watch";
      rows.push({
        key: uid + "|l" + it.id,
        title: it.title,
        cover: it.cover,
        c1: it.c1,
        c2: it.c2,
        genres: it.genres,
        status: st,
        isWatched: false,
        favd: false,
        rating: "",
        platform: "", // list items have no platform yet — they pass the Where filter via "All"
        sub: it.genres.slice(0, 2).join(" / ") || (it.year ? it.year + " · " + it.ep : "on the list"),
        user: uid,
        itemId: it.id,
        entryId: it.entryId || undefined,
      });
    }
  }

  const showUser = effUsers.length > 1;
  const filtered = rows.filter(
    (x) =>
      (genre === "All" || x.genres.includes(genre)) &&
      (status === "All" || (status === "Favorites" ? x.favd : x.status === status)) &&
      (platform === "All" || x.platform === platform)
  );

  const toggleUser = (id: string) => {
    let cur = effUsers.slice();
    const i = cur.indexOf(id);
    if (i >= 0) {
      if (cur.length > 1) cur.splice(i, 1);
    } else {
      cur = [...cur, id];
    }
    setWlUsers(cur);
  };

  const cycleStatus = async (row: Row) => {
    if (!row.itemId || row.user !== me) return;
    const ns = row.status === "Watching" ? "Plan" : "Watching";
    try {
      await setWatchlistStatus(row.itemId, me, ns);
      await refresh();
      flash("Moved to " + (ns === "Watching" ? "Currently watching" : "Plan to watch"));
    } catch (e) {
      flash(e instanceof Error ? e.message : "could not update");
    }
  };

  const removeItem = async (row: Row) => {
    if (!row.itemId || row.user !== me) return;
    try {
      await removeFromWatchlist(row.itemId, me);
      await refresh();
      flash("Removed from watchlist");
    } catch (e) {
      flash(e instanceof Error ? e.message : "could not remove");
    }
  };

  const subLabel =
    effUsers.length === 1
      ? resolvePerson(data.profiles, effUsers[0]).name.toUpperCase() + "’S LIST"
      : effUsers.length + " LISTS COMBINED";

  const ddBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`${styles.ddBtn} w-full flex items-center justify-between gap-6 pointer`}
      style={{ border: `1px solid ${active ? acc : "rgba(255,255,255,.1)"}` }}
    >
      <span className={styles.ellipsis}>{label}</span>
      <span className={styles.ddCaret}>▾</span>
    </button>
  );

  const ddMenu = (items: string[], sel: string, pick: (v: string) => void) => (
    <div className={styles.ddMenu}>
      {items.map((v) => (
        <button
          key={v}
          onClick={() => pick(v)}
          className={`${styles.ddItem} pointer`}
          style={{ background: sel === v ? acc : "transparent", color: sel === v ? "var(--bg-base)" : "var(--text-2)" }}
        >
          {v}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.screen}>
      {/* header */}
      <div className={`${styles.header} flex justify-between`}>
        <div>
          <div className="eyebrow" style={{ color: acc }}>{subLabel}</div>
          <div className={`${styles.title} screen-title`}>Watchlist</div>
        </div>
        <button onClick={() => setScreen("add")} className={`${styles.addBtn} flex-center pointer`} style={{ background: acc }}>
          <PlusIcon stroke="#0a0c0f" size={19} />
        </button>
      </div>

      {/* user chips */}
      <div className={`${styles.chipsRow} flex gap-12 scroll-x`}>
        {data.profiles.map((p) => {
          const sel = effUsers.includes(p.id);
          return (
            <div key={p.id} onClick={() => toggleUser(p.id)} className="flex-none flex-col items-center gap-6 pointer" style={{ opacity: sel ? 1 : 0.4 }}>
              <div className={`${styles.chipAvatar} avatar-round`} style={{ background: p.color, boxShadow: `0 0 0 2.5px ${sel ? acc : "transparent"}` }}>
                <img src={p.avatar} alt="" className="img-cover" />
              </div>
              <span className={styles.chipName} style={{ color: sel ? "var(--text-1)" : "var(--text-4)" }}>{p.name}</span>
            </div>
          );
        })}
      </div>

      {/* status segmented */}
      <div className={`${styles.segmented} flex`}>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`${styles.segBtn} flex-1 pointer`}
            style={{ background: status === s ? acc : "transparent", color: status === s ? "var(--bg-base)" : "var(--text-3)" }}
          >
            {s === "Plan to watch" ? "Plan" : s === "Favorites" ? "♥ Favs" : s}
          </button>
        ))}
      </div>

      {/* genre + where dropdowns */}
      <div className={`${styles.filters} relative flex gap-10`}>
        <div className="flex-1 relative">
          {ddBtn("Genre · " + genre, genre !== "All", () => setOpen(open === "genre" ? null : "genre"))}
          <RenderWhen.If isTrue={open === "genre"}>
            {ddMenu(WL_GENRES, genre, (v) => { setGenre(v); setOpen(null); })}
          </RenderWhen.If>
        </div>
        <div className="flex-1 relative">
          {ddBtn("Where · " + platform, platform !== "All", () => setOpen(open === "platform" ? null : "platform"))}
          <RenderWhen.If isTrue={open === "platform"}>
            {ddMenu(["All", ...PLATFORM_LIST], platform, (v) => { setPlatform(v); setOpen(null); })}
          </RenderWhen.If>
        </div>
      </div>

      {/* rows */}
      <div className="flex-col">
        {filtered.map((row) => {
          const per = resolvePerson(data.profiles, row.user);
          const sc = stColor(row.status);
          const openRow = () => {
            if (row.entryId) openDetail(row.entryId);
            else cycleStatus(row);
          };
          return (
            <div key={row.key} onClick={openRow} className={`${styles.row} flex items-center pointer`}>
              <div className={`${styles.rowCover} flex-none relative overflow-hidden`} style={{ background: `linear-gradient(155deg,${row.c1},${row.c2})` }}>
                <RenderWhen.If isTrue={!!row.cover}>
                  <img src={row.cover} alt="" className="absolute-fill img-cover" />
                </RenderWhen.If>
              </div>
              <div className="flex-1 minw-0">
                <div className={`${styles.rowTitle} ${styles.ellipsis}`}>{row.title}</div>
                <div className={`${styles.rowSub} ${styles.ellipsis}`}>{row.sub}</div>
              </div>
              <RenderWhen.If isTrue={showUser}>
                <span className={`${styles.rowUser} avatar-round flex-none`} style={{ background: per.color }}>
                  <img src={per.avatar} alt="" className="img-cover" />
                </span>
              </RenderWhen.If>
              <div className="flex-none flex items-center gap-8">
                <RenderWhen.If isTrue={row.favd}>
                  <span className={styles.heart}>♥</span>
                </RenderWhen.If>
                <RenderWhen.If isTrue={row.isWatched}>
                  <span className={styles.rating} style={{ color: acc }}>★ {row.rating}</span>
                </RenderWhen.If>
                <span className={styles.statusPill} style={{ background: sc + "22", color: sc }}>{row.status === "Plan to watch" ? "Plan" : row.status}</span>
                <RenderWhen.If isTrue={!row.isWatched && row.user === me}>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); removeItem(row); }}
                    title="Remove from watchlist"
                    className={`${styles.removeBtn} flex-center pointer`}
                  >
                    ✕
                  </button>
                </RenderWhen.If>
              </div>
            </div>
          );
        })}
        <RenderWhen.If isTrue={filtered.length === 0}>
          <div className={`${styles.empty} text-center`}>Nothing matches these filters.</div>
        </RenderWhen.If>
      </div>
    </div>
  );
}
