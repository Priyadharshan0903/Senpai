"use client";

import React, { useEffect, useState } from "react";
import { useSenpai } from "@/store";
import { CoverArt } from "@/components/CoverArt";
import { StarPicker } from "@/components/bits";
import { searchAnime, postLog, addToWatchlist, SearchResult, SearchCandidate } from "@/lib/api";
import { norm, MOOD_LIST, MOOD_META, PLATFORM_LIST, PLATFORM_META, GENRE_LIST } from "@/lib/theme";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mono" style={{ fontSize: 10, color: "#8a929e", letterSpacing: "1.5px", marginBottom: 11 }}>
    {children}
  </div>
);

export function Add() {
  const { acc, data, me, setScreen, openDetail, refresh, flash, consumeAddPrefill, setWlUsers } = useSenpai();

  const [title, setTitle] = useState("");
  const [finding, setFinding] = useState(false);
  const [found, setFound] = useState<SearchResult | null>(null);
  const [dupId, setDupId] = useState<string | null>(null);
  const [platform, setPlatform] = useState("");
  const [rating, setRating] = useState(0); // 0-5
  const [rewatch, setRewatch] = useState(0);
  const [mood, setMood] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [reflect, setReflect] = useState("");
  const [momentTitle, setMomentTitle] = useState("");
  const [momentWhy, setMomentWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [addStatus, setAddStatus] = useState<"Watched" | "Watching" | "Plan to watch">("Watched");
  const [candidates, setCandidates] = useState<SearchCandidate[]>([]);

  const isDup = !!dupId;

  const runSearch = async (term?: string) => {
    const t = (term ?? title).trim();
    if (!t) return;
    const dup = data?.entries.find((e) => norm(e.title) === norm(t)) || null;
    setDupId(dup ? dup.id : null);
    setFinding(true);
    setFound(null);
    try {
      if (dup) {
        setFinding(false);
        setFound({
          found: true,
          title: dup.title,
          cover: dup.cover,
          c1: dup.c1,
          c2: dup.c2,
          year: dup.year,
          ep: dup.ep,
          genres: dup.genres.slice(),
          matchLabel: "ALREADY ON SENPAI",
          anilistId: null,
          candidates: [],
        });
        setTitle(dup.title);
        setCandidates([]);
        return;
      }
      const res = await searchAnime(t);
      setFinding(false);
      setFound(res);
      setCandidates(res.candidates || []);
      if (res.title) setTitle(res.title);
    } catch {
      setFinding(false);
      setFound({ found: true, title: t, cover: "", c1: "#1a1e25", c2: "#141821", year: "", ep: "", genres: [], matchLabel: "NO MATCH — DROP YOUR OWN", anilistId: null, candidates: [] });
      setCandidates([]);
    }
  };

  // Arriving from a watchlist tap: pre-fill the title and search immediately.
  useEffect(() => {
    const t = consumeAddPrefill();
    if (t) {
      setTitle(t);
      runSearch(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickCandidate = (c: SearchCandidate) => {
    // check if the picked show is already on Senpai
    const dup = data?.entries.find((e) => norm(e.title) === norm(c.title)) || null;
    setDupId(dup ? dup.id : null);
    setFound({
      found: true,
      ...c,
      matchLabel: dup ? "ALREADY ON SENPAI" : c.cover ? "ARTWORK FOUND" : "NO MATCH — DROP YOUR OWN",
      candidates,
    });
    setTitle(c.title);
  };

  const watched = addStatus === "Watched";
  const ready0 = !!found && rating > 0 && !!mood && !!platform && (isDup || genres.length > 0);
  const ready = watched ? ready0 : !!found && (isDup || genres.length > 0);
  const meta = [found?.year, found?.ep].filter(Boolean).join(" · ") || "metadata unavailable";
  const matchLabel = isDup ? "ALREADY ON SENPAI" : found?.cover ? "ARTWORK FOUND" : "NO MATCH — DROP YOUR OWN";

  const submit = async () => {
    if (!me || !found) return;
    if (!watched) {
      // Watching / Plan to watch → goes to the watchlist, not the feed
      if (!isDup && genres.length === 0) {
        flash("pick at least one genre");
        return;
      }
      setBusy(true);
      try {
        const res = await addToWatchlist({
          user: me,
          title: found.title,
          status: addStatus === "Watching" ? "Watching" : "Plan",
          cover: found.cover,
          year: found.year,
          ep: found.ep,
          genres: (isDup ? found.genres : genres).slice(0, 3),
          c1: found.c1,
          c2: found.c2,
        });
        await refresh();
        flash(res.already ? "Already on your watchlist" : "Added to your watchlist");
        setWlUsers([me]);
        setScreen("watchlist");
      } catch (e) {
        flash(e instanceof Error ? e.message : "could not save");
        setBusy(false);
      }
      return;
    }
    if (rating <= 0 || !mood || !platform) {
      flash("add rating, mood & platform");
      return;
    }
    if (!isDup && genres.length === 0) {
      flash("pick at least one genre");
      return;
    }
    setBusy(true);
    try {
      const res = await postLog({
        user: me,
        title: found.title,
        rating: rating * 2,
        mood,
        platform,
        reflect,
        momentTitle,
        momentWhy,
        rewatch,
        year: found.year,
        ep: found.ep,
        genres: isDup ? undefined : genres.slice(0, 3),
        c1: found.c1,
        c2: found.c2,
        cover: found.cover,
      });
      await refresh();
      if (res.already) {
        flash("You already logged " + res.title);
        setScreen("feed");
        openDetail(res.id);
      } else if (res.appended) {
        flash("Added to " + res.title + " — rating re-averaged");
        setScreen("feed");
        openDetail(res.id);
      } else {
        flash("Logged to the feed");
        setScreen("feed");
      }
    } catch (e) {
      flash(e instanceof Error ? e.message : "could not log");
      setBusy(false);
    }
  };

  const chip = (selected: boolean, color: string) => ({
    background: selected ? color : "transparent",
    color: selected ? "#0a0c0f" : "#c6ccd4",
    borderColor: selected ? color : "rgba(255,255,255,.12)",
  });

  return (
    <div style={{ padding: "8px 18px 30px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={() => setScreen("feed")} style={{ width: 38, height: 38, borderRadius: 12, border: "1.5px solid rgba(255,255,255,.12)", background: "transparent", cursor: "pointer", color: "#f3f5f8", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <div>
          <div className="mono" style={{ fontSize: 10, color: acc, letterSpacing: "1.5px" }}>NEW LOG</div>
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.5px", color: "#f3f5f8" }}>Log a show</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 6px 6px 16px", borderRadius: 14, background: "#12161c", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.09)", marginBottom: 16 }}>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setFound(null); setFinding(false); setDupId(null); }}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="type the anime name..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f3f5f8", fontFamily: "var(--font-jakarta)", fontSize: 15, fontWeight: 600 }}
        />
        <button onClick={() => runSearch()} style={{ padding: "10px 16px", borderRadius: 11, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: acc, color: "#0a0c0f" }}>Search</button>
      </div>

      {finding && (
        <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 14, borderRadius: 16, background: "#12161c", marginBottom: 18 }}>
          <div style={{ width: 70, height: 94, borderRadius: 9, flex: "none", background: "linear-gradient(100deg,#1a1e25 30%,#252b34 50%,#1a1e25 70%)", backgroundSize: "220px 100%", animation: "cnShim 1s linear infinite" }} />
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 11, color: acc, letterSpacing: "1px" }}>SEARCHING THE WEB...</div>
            <div style={{ fontSize: 13, color: "#8a929e", marginTop: 6 }}>finding artwork for &quot;{title}&quot;</div>
          </div>
        </div>
      )}

      {isDup && found && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "13px 15px", borderRadius: 14, background: "#1a1410", boxShadow: `inset 0 0 0 1.5px ${acc}55`, marginBottom: 18 }}>
          <span style={{ color: acc, fontSize: 16 }}>↺</span>
          <div style={{ fontSize: 13, color: "#e7eaef", lineHeight: 1.4 }}>
            <b>{title}</b> is already on Senpai — your take will be <b style={{ color: acc }}>added to that card</b> and the rating re-averaged.
          </div>
        </div>
      )}

      {found && (
        <div style={{ animation: "cnUp .3s ease both" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "stretch", padding: 14, borderRadius: 16, background: "#12161c", boxShadow: `inset 0 0 0 1.5px ${acc}55`, marginBottom: 20 }}>
            <div style={{ width: 70, height: 94, borderRadius: 9, flex: "none", background: `linear-gradient(155deg,${found.c1},${found.c2})`, boxShadow: "0 6px 16px rgba(0,0,0,.4)", position: "relative", overflow: "hidden" }}>
              <CoverArt src={found.cover} placeholder="drop art" radius={9} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ color: acc, fontSize: 12 }}>✓</span>
                <span className="mono" style={{ fontSize: 10, color: acc, letterSpacing: "1px" }}>{matchLabel}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#f3f5f8", lineHeight: 1.1 }}>{title}</div>
              <div className="mono" style={{ fontSize: 11, color: "#8a929e", marginTop: 4 }}>{meta}</div>
              <div style={{ fontSize: 11, color: "#5a636f", marginTop: 8 }}>not it? drop the real cover on the poster</div>
            </div>
          </div>

          {/* did-you-mean candidates */}
          {candidates.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <Label>NOT IT? PICK THE RIGHT ONE</Label>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {candidates.map((c) => {
                  const sel = found?.title === c.title;
                  return (
                    <div key={c.anilistId ?? c.title} onClick={() => pickCandidate(c)} style={{ width: 84, flex: "none", cursor: "pointer" }}>
                      <div style={{ height: 112, borderRadius: 9, overflow: "hidden", background: `linear-gradient(155deg,${c.c1},${c.c2})`, position: "relative", boxShadow: sel ? `0 0 0 2px ${acc}` : "0 4px 12px rgba(0,0,0,.4)" }}>
                        {c.cover && <img src={c.cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 10.5, color: sel ? "#f3f5f8" : "#8a929e", marginTop: 6, lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Label>STATUS</Label>
          <div style={{ display: "flex", background: "#12161c", borderRadius: 13, padding: 3, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)", marginBottom: 22 }}>
            {(["Watched", "Watching", "Plan to watch"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setAddStatus(st)}
                style={{ flex: 1, padding: "9px 4px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11.5, background: addStatus === st ? acc : "transparent", color: addStatus === st ? "#0a0c0f" : "#9aa3af", whiteSpace: "nowrap" }}
              >
                {st === "Plan to watch" ? "Plan" : st}
              </button>
            ))}
          </div>

          <Label>WHERE DID YOU WATCH IT?</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
            {PLATFORM_LIST.map((p) => {
              const c = chip(platform === p, PLATFORM_META[p]);
              return (
                <button key={p} onClick={() => setPlatform(p)} style={{ padding: "9px 14px", borderRadius: 11, border: `1.5px solid ${c.borderColor}`, background: c.background, color: c.color, cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>{p}</button>
              );
            })}
          </div>

          {watched && (
          <>
          <Label>YOUR RATING</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <StarPicker value={rating} onPick={setRating} acc={acc} size={32} />
            <span className="mono" style={{ fontWeight: 700, fontSize: 20, color: acc }}>{rating > 0 ? rating * 2 + "/10" : "–/10"}</span>
          </div>

          <Label>HAVE YOU REWATCHED IT?</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <button onClick={() => setRewatch(Math.max(0, rewatch - 1))} style={stepBtn}>−</button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, color: "#c6ccd4" }}>{rewatch === 0 ? "First watch" : rewatch + "× rewatched"}</span>
            <button onClick={() => setRewatch(rewatch + 1)} style={stepBtn}>+</button>
          </div>

          <Label>HOW DID IT MAKE YOU FEEL?</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
            {MOOD_LIST.map((m) => {
              const c = chip(mood === m, MOOD_META[m]);
              return (
                <button key={m} onClick={() => setMood(m)} style={{ padding: "9px 15px", borderRadius: 20, border: `1.5px solid ${c.borderColor}`, background: c.background, color: c.color, cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>{m}</button>
              );
            })}
          </div>
          </>
          )}

          {!isDup && (
            <>
              <Label>GENRE</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
                {GENRE_LIST.map((g) => {
                  const sel = genres.includes(g);
                  const c = chip(sel, acc);
                  return (
                    <button
                      key={g}
                      onClick={() => setGenres(sel ? genres.filter((x) => x !== g) : [...genres, g])}
                      style={{ padding: "8px 13px", borderRadius: 11, border: `1.5px solid ${c.borderColor}`, background: c.background, color: c.color, cursor: "pointer", fontWeight: 600, fontSize: 12 }}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {watched && (
          <>
          <Label>YOUR THOUGHTS <span style={{ color: "#5a636f" }}>· optional</span></Label>
          <textarea
            value={reflect}
            onChange={(e) => setReflect(e.target.value)}
            placeholder="optional — skip this if you just want to log that you watched it"
            style={{ width: "100%", height: 88, padding: 14, borderRadius: 14, background: "#12161c", border: "none", outline: "none", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.09)", color: "#f3f5f8", fontFamily: "var(--font-jakarta)", fontSize: 14, lineHeight: 1.5, marginBottom: 22 }}
          />

          <div className="mono" style={{ fontSize: 10, color: "#8a929e", letterSpacing: "1.5px", marginBottom: 11 }}>
            FAVORITE MOMENT <span style={{ color: "#5a636f" }}>· optional</span>
          </div>
          <input
            value={momentTitle}
            onChange={(e) => setMomentTitle(e.target.value)}
            placeholder="e.g. Ep 10 — the rooftop"
            style={{ width: "100%", padding: "13px 14px", borderRadius: 12, background: "#12161c", border: "none", outline: "none", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.09)", color: "#f3f5f8", fontFamily: "var(--font-jakarta)", fontSize: 14, fontWeight: 600, marginBottom: 10 }}
          />
          <textarea
            value={momentWhy}
            onChange={(e) => setMomentWhy(e.target.value)}
            placeholder="why did it hit so hard?"
            style={{ width: "100%", height: 66, padding: "13px 14px", borderRadius: 12, background: "#12161c", border: "none", outline: "none", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.09)", color: "#f3f5f8", fontFamily: "var(--font-jakarta)", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}
          />
          </>
          )}

          <button
            onClick={submit}
            disabled={busy}
            style={{ width: "100%", padding: 16, borderRadius: 15, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 16, background: ready ? acc : "#181c22", color: ready ? "#0a0c0f" : "#5a636f", opacity: busy ? 0.7 : 1 }}
          >
            {!watched
              ? ready
                ? "Add to " + (addStatus === "Watching" ? "Currently watching" : "Plan to watch")
                : "Search a show & pick a genre"
              : ready
              ? isDup
                ? "Add my take to this show"
                : "Log it to the feed"
              : "Fill rating, mood & platform"}
          </button>
        </div>
      )}

      {!finding && !found && (
        <div style={{ textAlign: "center", color: "#4a525d", fontSize: 13, padding: "36px 30px", lineHeight: 1.6 }}>
          Type a show and tap <b style={{ color: "#8a929e" }}>Search</b> — Senpai pulls its real artwork, year, and genres from the web.
        </div>
      )}
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 11,
  border: "1.5px solid rgba(255,255,255,.12)",
  background: "transparent",
  color: "#f3f5f8",
  fontSize: 22,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
