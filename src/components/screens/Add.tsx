"use client";

import React, { useEffect, useState } from "react";
import { useSenpai } from "@/store";
import { CoverArt } from "@/components/CoverArt";
import { StarPicker } from "@/components/bits";
import { RenderWhen } from "@/components/RenderWhen";
import { searchAnime, postLog, addToWatchlist, SearchResult, SearchCandidate } from "@/lib/api";
import { norm, MOOD_LIST, MOOD_META, PLATFORM_LIST, PLATFORM_META, GENRE_LIST, artPairForTitle } from "@/lib/theme";
import { avg } from "@/lib/derive";
import styles from "./Add.module.css";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className={`mono ${styles.label}`}>
    {children}
  </div>
);

type Phase = "idle" | "searching" | "results" | "form";

export function Add() {
  const { acc, data, me, setScreen, openDetail, refresh, flash, consumeAddPrefill, setWlUsers } = useSenpai();

  const [phase, setPhase] = useState<Phase>("idle");
  const [title, setTitle] = useState("");
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
  const [searched, setSearched] = useState(""); // the query the results belong to

  const isDup = !!dupId;

  // Search always leads to the results list — the user picks from it.
  const runSearch = async (term?: string) => {
    const t = (term ?? title).trim();
    if (!t) return;
    setPhase("searching");
    setFound(null);
    setDupId(null);
    setSearched(t);
    try {
      const res = await searchAnime(t);
      setCandidates(res.candidates || []);
      setPhase("results");
    } catch {
      setCandidates([]);
      setPhase("results");
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

  /** Find an existing crew entry for a candidate — anilistId beats title matching
   *  (AniList says "Frieren: Beyond Journey's End", the crew card says "Frieren"). */
  const findEntry = (c: { anilistId?: number | null; title: string }) =>
    data?.entries.find(
      (e) =>
        (c.anilistId != null && e.anilistId != null && e.anilistId === c.anilistId) ||
        norm(e.title) === norm(c.title)
    ) || null;

  /** What we already know about a candidate. */
  const hintFor = (c: SearchCandidate) => {
    const entry = findEntry(c);
    if (entry) {
      const mine = entry.watches.some((w) => w.user === me);
      const a = avg(entry).toFixed(1);
      return mine
        ? { entry, text: `✓ You logged this · ★ ${a}`, color: "#57c99a" }
        : { entry, text: `Already on Senpai · ${entry.watches.length} ${entry.watches.length === 1 ? "log" : "logs"} · ★ ${a}`, color: acc };
    }
    const wl = data?.watchlist.find(
      (w) =>
        w.user === me &&
        ((c.anilistId != null && w.anilistId != null && w.anilistId === c.anilistId) ||
          norm(w.title) === norm(c.title))
    );
    if (wl) {
      return { entry: null, text: "On your watchlist · " + (wl.status === "Watching" ? "Watching" : "Plan to watch"), color: "#7c8698" };
    }
    return null;
  };

  const pickCandidate = (c: SearchCandidate) => {
    const dup = findEntry(c);
    setDupId(dup ? dup.id : null);
    setFound({
      found: true,
      ...c,
      // an existing entry's stored art/meta wins over the fresh search result
      cover: dup?.cover || c.cover,
      c1: dup?.c1 || c.c1,
      c2: dup?.c2 || c.c2,
      year: dup?.year || c.year,
      ep: dup?.ep || c.ep,
      genres: dup ? dup.genres.slice() : c.genres,
      matchLabel: dup ? "ALREADY ON SENPAI" : c.cover ? "ARTWORK FOUND" : "NO MATCH — DROP YOUR OWN",
      candidates,
    });
    setTitle(dup ? dup.title : c.title);
    setPhase("form");
  };

  const pickFallback = () => {
    // nothing matched anywhere — log the typed title with a gradient card
    const [c1, c2] = artPairForTitle(searched);
    pickCandidate({ anilistId: null, title: searched, cover: "", c1, c2, year: "", ep: "", genres: [] });
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
          anilistId: found.anilistId,
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
        anilistId: found.anilistId,
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
    <div className={styles.screen}>
      <div className={`${styles.header} flex items-center gap-12`}>
        <button onClick={() => setScreen("feed")} className={`${styles.backBtn} flex-center pointer`}>‹</button>
        <div>
          <div className={`mono ${styles.headerEyebrow}`} style={{ color: acc }}>NEW LOG</div>
          <div className={styles.title}>Log a show</div>
        </div>
      </div>

      <div className={`${styles.searchBar} flex items-center gap-10`}>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setPhase("idle"); setFound(null); setDupId(null); }}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="type the anime name..."
          className={`${styles.searchInput} flex-1`}
        />
        <button onClick={() => runSearch()} className={`${styles.searchBtn} pointer`} style={{ background: acc }}>Search</button>
      </div>

      {/* ===== SEARCHING ===== */}
      <RenderWhen.If isTrue={phase === "searching"}>
        <div className={`${styles.searchingCard} flex items-center`}>
          <div className={`${styles.shimmer} flex-none`} />
          <div className="flex-1">
            <div className={`mono ${styles.searchingLabel}`} style={{ color: acc }}>SEARCHING THE WEB...</div>
            <div className={styles.searchingSub}>finding matches for &quot;{title}&quot;</div>
          </div>
        </div>
      </RenderWhen.If>

      {/* ===== RESULTS LIST ===== */}
      <RenderWhen.If isTrue={phase === "results"}>
        <div className={styles.animUp}>
          <Label>
            {candidates.length > 0 ? `RESULTS FOR “${searched.toUpperCase()}” · TAP ONE` : "NO MATCHES FOUND"}
          </Label>
          <div className="flex-col gap-10">
            {candidates.map((c) => {
              const hint = hintFor(c);
              return (
                <div
                  key={c.anilistId ?? c.title}
                  onClick={() => pickCandidate(c)}
                  className={`${styles.resultRow} flex items-center gap-12 pointer`}
                >
                  <div className={`${styles.thumb} flex-none relative overflow-hidden`} style={{ background: `linear-gradient(155deg,${c.c1},${c.c2})` }}>
                    <CoverArt src={c.cover} placeholder="no art" radius={8} />
                  </div>
                  <div className="flex-1 minw-0">
                    <div className={`${styles.resultTitle} clamp2`}>{c.title}</div>
                    <div className={styles.resultMeta}>
                      {[c.genres.slice(0, 3).join(" · "), [c.year, c.ep].filter(Boolean).join(" · ")].filter(Boolean).join("  ·  ") || "no metadata"}
                    </div>
                    <RenderWhen.If isTrue={!!hint}>
                      <div className={styles.resultHint} style={{ color: hint?.color }}>{hint?.text}</div>
                    </RenderWhen.If>
                  </div>
                  <span className={`${styles.chevron} flex-none`}>›</span>
                </div>
              );
            })}

            {/* nothing found anywhere — offer to log the typed title as-is */}
            <RenderWhen.If isTrue={candidates.length === 0}>
              <div
                onClick={pickFallback}
                className={`${styles.resultRow} flex items-center gap-12 pointer`}
                style={{ boxShadow: `inset 0 0 0 1.5px ${acc}44` }}
              >
                <div className={`${styles.thumb} flex-none`} style={{ background: `linear-gradient(155deg,${artPairForTitle(searched)[0]},${artPairForTitle(searched)[1]})` }} />
                <div className="flex-1 minw-0">
                  <div className={styles.fallbackTitle}>{searched}</div>
                  <div className={styles.fallbackSub}>couldn&apos;t find it on the web — log it anyway with a gradient card</div>
                </div>
                <span className={`${styles.chevron} flex-none`}>›</span>
              </div>
            </RenderWhen.If>
          </div>
        </div>
      </RenderWhen.If>

      {/* ===== FORM ===== */}
      <RenderWhen.If isTrue={phase === "form" && !!found}>
        <div className={styles.animUp}>
          <RenderWhen.If isTrue={isDup}>
            <div className={`${styles.dupBanner} flex items-center gap-10`} style={{ boxShadow: `inset 0 0 0 1.5px ${acc}55` }}>
              <span className={styles.dupIcon} style={{ color: acc }}>↺</span>
              <div className={styles.dupText}>
                <b>{title}</b> is already on Senpai — your take will be <b style={{ color: acc }}>added to that card</b> and the rating re-averaged.
              </div>
            </div>
          </RenderWhen.If>

          <div className={`${styles.heroCard} flex`} style={{ boxShadow: `inset 0 0 0 1.5px ${acc}55` }}>
            <div className={`${styles.heroCover} flex-none relative overflow-hidden`} style={{ background: `linear-gradient(155deg,${found?.c1},${found?.c2})` }}>
              <CoverArt src={found?.cover} placeholder="no art" radius={9} />
            </div>
            <div className="flex-1 flex-col justify-center">
              <div className={`${styles.matchRow} flex items-center gap-6`}>
                <span className={styles.matchCheck} style={{ color: acc }}>✓</span>
                <span className={`mono ${styles.matchLabel}`} style={{ color: acc }}>{matchLabel}</span>
              </div>
              <div className={styles.heroTitle}>{title}</div>
              <div className={`mono ${styles.heroMeta}`}>{meta}</div>
            </div>
          </div>
          <button
            onClick={() => setPhase("results")}
            className={`${styles.backLink} pointer`}
          >
            ‹ not it? back to results
          </button>

          <Label>STATUS</Label>
          <div className={`${styles.segmented} flex`}>
            {(["Watched", "Watching", "Plan to watch"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setAddStatus(st)}
                className={`${styles.segBtn} flex-1 pointer`}
                style={{ background: addStatus === st ? acc : "transparent", color: addStatus === st ? "#0a0c0f" : "#9aa3af" }}
              >
                {st === "Plan to watch" ? "Plan" : st}
              </button>
            ))}
          </div>

          <Label>WHERE DID YOU WATCH IT?</Label>
          <div className={`${styles.chipRow} flex gap-8`}>
            {PLATFORM_LIST.map((p) => {
              const c = chip(platform === p, PLATFORM_META[p]);
              return (
                <button key={p} onClick={() => setPlatform(p)} className={`${styles.platformChip} pointer`} style={c}>{p}</button>
              );
            })}
          </div>

          <RenderWhen.If isTrue={watched}>
          <>
          <Label>YOUR RATING</Label>
          <div className={`${styles.ratingRow} flex items-center`}>
            <StarPicker value={rating} onPick={setRating} acc={acc} size={32} />
            <span className={`mono ${styles.ratingValue}`} style={{ color: acc }}>{rating > 0 ? rating * 2 + "/10" : "–/10"}</span>
          </div>

          <Label>HAVE YOU REWATCHED IT?</Label>
          <div className={`${styles.rewatchRow} flex items-center gap-16`}>
            <button onClick={() => setRewatch(Math.max(0, rewatch - 1))} className={`${styles.stepBtn} flex-center pointer`}>−</button>
            <span className={`${styles.rewatchLabel} flex-1 text-center`}>{rewatch === 0 ? "First watch" : rewatch + "× rewatched"}</span>
            <button onClick={() => setRewatch(rewatch + 1)} className={`${styles.stepBtn} flex-center pointer`}>+</button>
          </div>

          <Label>HOW DID IT MAKE YOU FEEL?</Label>
          <div className={`${styles.chipRow} flex gap-8`}>
            {MOOD_LIST.map((m) => {
              const c = chip(mood === m, MOOD_META[m]);
              return (
                <button key={m} onClick={() => setMood(m)} className={`${styles.moodChip} pointer`} style={c}>{m}</button>
              );
            })}
          </div>
          </>
          </RenderWhen.If>

          <RenderWhen.If isTrue={!isDup}>
            <>
              <Label>GENRE</Label>
              <div className={`${styles.chipRow} flex gap-8`}>
                {GENRE_LIST.map((g) => {
                  const sel = genres.includes(g);
                  const c = chip(sel, acc);
                  return (
                    <button
                      key={g}
                      onClick={() => setGenres(sel ? genres.filter((x) => x !== g) : [...genres, g])}
                      className={`${styles.genreChip} pointer`}
                      style={c}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </>
          </RenderWhen.If>

          <RenderWhen.If isTrue={watched}>
          <>
          <Label>YOUR THOUGHTS <span className={styles.optional}>· optional</span></Label>
          <textarea
            value={reflect}
            onChange={(e) => setReflect(e.target.value)}
            placeholder="optional — skip this if you just want to log that you watched it"
            className={`${styles.field} ${styles.reflectField} w-full`}
          />

          <div className={`mono ${styles.label}`}>
            FAVORITE MOMENT <span className={styles.optional}>· optional</span>
          </div>
          <input
            value={momentTitle}
            onChange={(e) => setMomentTitle(e.target.value)}
            placeholder="e.g. Ep 10 — the rooftop"
            className={`${styles.field} ${styles.momentTitleField} w-full`}
          />
          <textarea
            value={momentWhy}
            onChange={(e) => setMomentWhy(e.target.value)}
            placeholder="why did it hit so hard?"
            className={`${styles.field} ${styles.momentWhyField} w-full`}
          />
          </>
          </RenderWhen.If>

          <button
            onClick={submit}
            disabled={busy}
            className={`${styles.submitBtn} w-full pointer`}
            style={{ background: ready ? acc : "#181c22", color: ready ? "#0a0c0f" : "#5a636f", opacity: busy ? 0.7 : 1 }}
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
      </RenderWhen.If>

      {/* ===== IDLE ===== */}
      <RenderWhen.If isTrue={phase === "idle"}>
        <div className={`${styles.idleHint} text-center`}>
          Type a show and hit <b className={styles.idleKey}>Enter</b> — Senpai searches the web (typos welcome) and shows you the matches to pick from.
        </div>
      </RenderWhen.If>
    </div>
  );
}
