"use client";

import React, { useState } from "react";
import { useSenpai } from "@/store";
import { resolvePerson } from "@/lib/derive";
import { PLATFORM_LIST } from "@/lib/theme";
import { setWatchlistStatus, removeFromWatchlist } from "@/lib/api";
import { PlusIcon } from "@/components/bits";

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
      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, padding: "10px 13px", borderRadius: 11, border: `1px solid ${active ? acc : "rgba(255,255,255,.1)"}`, background: "#12161c", cursor: "pointer", fontWeight: 600, fontSize: 12.5, color: "#e7eaef" }}
    >
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <span style={{ color: "#8a929e", fontSize: 10 }}>▾</span>
    </button>
  );

  const ddMenu = (items: string[], sel: string, pick: (v: string) => void) => (
    <div style={{ position: "absolute", top: 47, left: 0, right: 0, background: "#1a1e25", borderRadius: 12, boxShadow: "0 14px 34px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.08)", padding: 6, maxHeight: 236, overflowY: "auto", zIndex: 30 }}>
      {items.map((v) => (
        <button
          key={v}
          onClick={() => pick(v)}
          style={{ width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: sel === v ? acc : "transparent", color: sel === v ? "#0a0c0f" : "#c6ccd4", fontWeight: 600, fontSize: 13 }}
        >
          {v}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "8px 0 24px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 18px", marginBottom: 14 }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: acc, letterSpacing: "1.5px" }}>{subLabel}</div>
          <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: "-.8px", color: "#f3f5f8", marginTop: 2 }}>Watchlist</div>
        </div>
        <button onClick={() => setScreen("add")} style={{ width: 38, height: 38, borderRadius: 12, border: "none", cursor: "pointer", background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PlusIcon stroke="#0a0c0f" size={19} />
        </button>
      </div>

      {/* user chips */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 18px 14px" }}>
        {data.profiles.map((p) => {
          const sel = effUsers.includes(p.id);
          return (
            <div key={p.id} onClick={() => toggleUser(p.id)} style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", opacity: sel ? 1 : 0.4 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", background: p.color, boxShadow: `0 0 0 2.5px ${sel ? acc : "transparent"}` }}>
                <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: sel ? "#f3f5f8" : "#8a929e" }}>{p.name}</span>
            </div>
          );
        })}
      </div>

      {/* status segmented */}
      <div style={{ margin: "0 18px 12px", display: "flex", background: "#12161c", borderRadius: 13, padding: 3, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{ flex: 1, padding: "9px 4px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11.5, background: status === s ? acc : "transparent", color: status === s ? "#0a0c0f" : "#9aa3af", whiteSpace: "nowrap" }}
          >
            {s === "Plan to watch" ? "Plan" : s === "Favorites" ? "♥ Favs" : s}
          </button>
        ))}
      </div>

      {/* genre + where dropdowns */}
      <div style={{ position: "relative", zIndex: 15, display: "flex", gap: 10, padding: "0 18px 16px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          {ddBtn("Genre · " + genre, genre !== "All", () => setOpen(open === "genre" ? null : "genre"))}
          {open === "genre" && ddMenu(WL_GENRES, genre, (v) => { setGenre(v); setOpen(null); })}
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          {ddBtn("Where · " + platform, platform !== "All", () => setOpen(open === "platform" ? null : "platform"))}
          {open === "platform" && ddMenu(["All", ...PLATFORM_LIST], platform, (v) => { setPlatform(v); setOpen(null); })}
        </div>
      </div>

      {/* rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((row) => {
          const per = resolvePerson(data.profiles, row.user);
          const sc = stColor(row.status);
          const openRow = () => {
            if (row.entryId) openDetail(row.entryId);
            else cycleStatus(row);
          };
          return (
            <div key={row.key} onClick={openRow} style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 18px", borderBottom: "1px solid rgba(255,255,255,.05)", cursor: "pointer" }}>
              <div style={{ width: 42, height: 56, borderRadius: 7, flex: "none", background: `linear-gradient(155deg,${row.c1},${row.c2})`, position: "relative", overflow: "hidden" }}>
                {row.cover && <img src={row.cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: "#f3f5f8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.title}</div>
                <div style={{ fontSize: 11.5, color: "#8a929e", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.sub}</div>
              </div>
              {showUser && (
                <span style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", flex: "none", background: per.color, display: "block" }}>
                  <img src={per.avatar} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
                </span>
              )}
              <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>
                {row.favd && <span style={{ color: "#ff6f61", fontSize: 13 }}>♥</span>}
                {row.isWatched && <span style={{ color: acc, fontWeight: 800, fontSize: 13.5 }}>★ {row.rating}</span>}
                <span style={{ padding: "4px 10px", borderRadius: 14, fontSize: 10.5, fontWeight: 700, background: sc + "22", color: sc }}>{row.status === "Plan to watch" ? "Plan" : row.status}</span>
                {!row.isWatched && row.user === me && (
                  <button
                    onClick={(ev) => { ev.stopPropagation(); removeItem(row); }}
                    title="Remove from watchlist"
                    style={{ width: 24, height: 24, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,.06)", color: "#8a929e", fontSize: 11, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#5a636f", fontSize: 13, padding: "40px 20px" }}>Nothing matches these filters.</div>
        )}
      </div>
    </div>
  );
}
