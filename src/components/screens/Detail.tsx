"use client";

import React, { useEffect, useState } from "react";
import { useSenpai } from "@/store";
import { CoverArt } from "@/components/CoverArt";
import { Avatar, Stars, StarPicker } from "@/components/bits";
import { RenderWhen } from "@/components/RenderWhen";
import { avg, buildEmotes, resolvePerson, MOOD_META, moodBgOf } from "@/lib/derive";
import { MOOD_LIST, PLATFORM_LIST, PLATFORM_META, rewatchLabel } from "@/lib/theme";
import { postFact, confirmFact, postLog, editLog, addToWatchlist, removeFromWatchlist, setCover } from "@/lib/api";
import styles from "./Detail.module.css";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className={`mono ${styles.label}`}>{children}</div>
);

export function Detail() {
  const { acc, data, me, detailId, closeDetail, reactEmote, refresh, flash, toggleFavorite } = useSenpai();

  const [takeRating, setTakeRating] = useState(0);
  const [takeMood, setTakeMood] = useState("");
  const [takePlatform, setTakePlatform] = useState("");
  const [takeReflect, setTakeReflect] = useState("");
  const [takeRewatch, setTakeRewatch] = useState(0);
  const [takeMomentTitle, setTakeMomentTitle] = useState("");
  const [takeMomentWhy, setTakeMomentWhy] = useState("");
  const [editing, setEditing] = useState(false);
  const [factDraft, setFactDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [artOpen, setArtOpen] = useState(false);
  const [artUrl, setArtUrl] = useState("");

  // fresh form whenever a different show opens
  useEffect(() => {
    setTakeRating(0);
    setTakeMood("");
    setTakePlatform("");
    setTakeReflect("");
    setTakeRewatch(0);
    setTakeMomentTitle("");
    setTakeMomentWhy("");
    setEditing(false);
    setFactDraft("");
    setArtOpen(false);
    setArtUrl("");
  }, [detailId]);

  const e = data?.entries.find((x) => x.id === detailId);
  if (!e || !data || !me) return null;

  const emotes = buildEmotes(e, acc);
  const myWatch = e.watches.find((w) => w.user === me);
  const mine = !!myWatch;
  const takeReady = takeRating > 0 && !!takeMood;
  const factReady = factDraft.trim().length > 0;
  const showForm = !mine || editing;

  const startEdit = () => {
    if (!myWatch) return;
    setTakeRating(myWatch.rating / 2);
    setTakeMood(myWatch.mood);
    setTakePlatform(myWatch.platform);
    setTakeReflect(myWatch.reflect);
    setTakeRewatch(myWatch.rewatch || 0);
    setTakeMomentTitle(myWatch.momentTitle || "");
    setTakeMomentWhy(myWatch.momentWhy || "");
    setEditing(true);
  };

  const resetForm = () => {
    setTakeRating(0);
    setTakeMood("");
    setTakePlatform("");
    setTakeReflect("");
    setTakeRewatch(0);
    setTakeMomentTitle("");
    setTakeMomentWhy("");
    setEditing(false);
  };

  // bookmark state: my watchlist item pointing at this entry (or its title)
  const myWatchItem = data.watchlist.find((w) => w.user === me && (w.entryId === e.id || w.title === e.title));

  const toggleBookmark = async () => {
    try {
      if (myWatchItem) {
        await removeFromWatchlist(myWatchItem.id, me);
        await refresh();
        flash("Removed from watchlist");
      } else {
        await addToWatchlist({
          user: me,
          title: e.title,
          cover: e.cover,
          year: e.year,
          ep: e.ep,
          genres: e.genres,
          c1: e.c1,
          c2: e.c2,
        });
        await refresh();
        flash("Saved to your watchlist");
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : "could not update watchlist");
    }
  };

  const saveArt = async () => {
    const url = artUrl.trim();
    if (!url) return;
    try {
      await setCover(e.id, url);
      await refresh();
      setArtOpen(false);
      setArtUrl("");
      flash("Background art updated");
    } catch (err) {
      flash(err instanceof Error ? err.message : "could not set art");
    }
  };

  const removeArt = async () => {
    try {
      await setCover(e.id, "");
      await refresh();
      setArtOpen(false);
      flash("Background art removed");
    } catch (err) {
      flash(err instanceof Error ? err.message : "could not remove art");
    }
  };

  const submitTake = async () => {
    if (!takeReady) {
      flash("add a rating & mood");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await editLog({
          animeId: e.id,
          user: me,
          rating: takeRating * 2,
          mood: takeMood,
          platform: takePlatform || undefined,
          reflect: takeReflect,
          momentTitle: takeMomentTitle,
          momentWhy: takeMomentWhy,
          rewatch: takeRewatch,
        });
        await refresh();
        resetForm();
        flash("Take updated — average re-derived");
      } else {
        await postLog({
          user: me,
          title: e.title,
          rating: takeRating * 2,
          mood: takeMood,
          platform: takePlatform || "Crunchyroll",
          reflect: takeReflect,
          momentTitle: takeMomentTitle,
          momentWhy: takeMomentWhy,
          rewatch: takeRewatch,
        });
        await refresh();
        resetForm();
        flash("Your rating joined the average");
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : "could not post");
    } finally {
      setBusy(false);
    }
  };

  const submitFact = async () => {
    const txt = factDraft.trim();
    if (!txt) return;
    // per-user idempotency: same person can't re-post the same fact on this show
    const normText = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
    if (e.facts.some((f) => f.user === me && normText(f.text) === normText(txt))) {
      flash("You already added this exact fact");
      return;
    }
    try {
      await postFact(e.id, me, txt);
      await refresh();
      setFactDraft("");
      flash("Fact added — awaiting crew confirms");
    } catch (err) {
      flash(err instanceof Error ? err.message : "could not add fact");
    }
  };

  const toggleConfirm = async (factId: string) => {
    try {
      await confirmFact(e.id, factId, me);
      await refresh();
    } catch (err) {
      flash(err instanceof Error ? err.message : "could not confirm");
    }
  };

  return (
    <div className={`${styles.screen} absolute-fill scroll-y`}>
      {/* hero */}
      <div className={`${styles.hero} relative`} style={{ background: `linear-gradient(155deg,${e.c1},${e.c2})` }}>
        <CoverArt src={e.cover} />
        <div className={`${styles.heroScrim} absolute-fill`} />
        <button onClick={closeDetail} className={`${styles.backBtn} flex-center`}>‹</button>
        <RenderWhen.If isTrue={!mine}>
          <button
            onClick={toggleBookmark}
            title={myWatchItem ? "Remove from watchlist" : "Save to watchlist"}
            className={`${styles.bookmarkBtn} flex-center`}
            style={{ background: myWatchItem ? acc : "rgba(8,10,13,.55)", color: myWatchItem ? "#0a0c0f" : "#fff" }}
          >
            {myWatchItem ? "◆" : "◇"}
          </button>
        </RenderWhen.If>
        <div className={`${styles.heroActions} flex items-center gap-8`}>
          <button
            onClick={() => toggleFavorite(e.id)}
            title={e.favs.includes(me) ? "Remove from favorites" : "Add to favorites"}
            className={`${styles.favBtn} flex-center`}
            style={{ background: e.favs.includes(me) ? "rgba(255,111,97,.2)" : "rgba(8,10,13,.55)" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill={e.favs.includes(me) ? "#ff6f61" : "none"} stroke={e.favs.includes(me) ? "#ff6f61" : "rgba(255,255,255,.8)"} strokeWidth={2.2} strokeLinejoin="round"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.6 4.5 6.4 4.5c2.2 0 3.9 1.2 5.6 3.4 1.7-2.2 3.4-3.4 5.6-3.4 3.8 0 6 3.9 4.4 7.2C19.5 16.4 12 21 12 21z" /></svg>
          </button>
          <div className={`${styles.ratingPill} flex items-center`} style={{ color: acc }}>
            <span>★</span>
            <span className="mono">{avg(e).toFixed(1)}</span>
          </div>
        </div>
        <button
          onClick={() => { setArtOpen(!artOpen); setArtUrl(""); }}
          title="Change background art"
          className={`${styles.artBtn} flex-center`}
          style={{ right: mine ? 16 : 62, background: artOpen ? acc : "rgba(8,10,13,.55)", color: artOpen ? "#0a0c0f" : "#fff" }}
        >
          ✎
        </button>
        <div className={styles.heroMeta}>
          <div className={`${styles.genreRow} flex gap-6`}>
            {e.genres.map((g) => (
              <span key={g} className={styles.genreChip}>{g}</span>
            ))}
          </div>
          <div className={styles.heroTitle}>{e.title}</div>
          <div className={`mono ${styles.heroSub}`}>
            {e.year} · {e.ep} · {e.watches.length} logged
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* background art editor */}
        <RenderWhen.If isTrue={artOpen}>
          <div className={styles.artEditor} style={{ boxShadow: `inset 0 0 0 1.5px ${acc}44` }}>
            <div className={`mono ${styles.label} ${styles.artEditorTitle}`}>BACKGROUND ART</div>
            <div className={`${styles.artInputRow} flex items-center`}>
              <input
                value={artUrl}
                onChange={(ev) => setArtUrl(ev.target.value)}
                onKeyDown={(ev) => ev.key === "Enter" && saveArt()}
                placeholder="paste an image URL for the cover..."
                className={`${styles.inputBare} ${styles.artInput} flex-1`}
              />
              <button onClick={saveArt} className={styles.setBtn} style={{ background: artUrl.trim() ? acc : "#181c22", color: artUrl.trim() ? "#0a0c0f" : "#5a636f" }}>Set</button>
            </div>
            <RenderWhen.If isTrue={!!e.cover}>
              <button onClick={removeArt} className={`${styles.removeArtBtn} w-full`}>
                Remove current art — fall back to the gradient
              </button>
            </RenderWhen.If>
          </div>
        </RenderWhen.If>

        {/* rating summary */}
        <div className={`${styles.summaryCard} flex items-center gap-16`}>
          <div className="text-center">
            <div className={styles.avgNum} style={{ color: acc }}>{avg(e).toFixed(1)}</div>
            <div className={`mono ${styles.avgLabel}`}>CREW AVG</div>
          </div>
          <div className={styles.vDivider} />
          <div className={`${styles.summaryText} flex-1`}>
            Averaged from <b className={styles.bright}>{e.watches.length}</b> {e.watches.length === 1 ? "log" : "logs"}. Every rating below counts toward it.
          </div>
        </div>

        {/* emotes */}
        <div className={`${styles.emoteRow} flex`}>
          {emotes.map((em) => (
            <button key={em.emoji} onClick={() => reactEmote(e.id, em.emoji)} className={`${styles.emoteBtn} flex items-center`} style={{ background: em.bg, boxShadow: em.ring }}>
              <span className={styles.emoteEmoji}>{em.emoji}</span>
              <span className={`mono ${styles.emoteCount}`} style={{ color: em.fg }}>{em.count}</span>
            </button>
          ))}
        </div>

        <div className={styles.sectionLabel}>
          <Label>WHO LOGGED IT · {e.watches.length}</Label>
        </div>
        <div className={`${styles.watchList} flex-col`}>
          {e.watches.map((w, i) => {
            const p = resolvePerson(data.profiles, w.user);
            const mc = MOOD_META[w.mood] || "#8a929e";
            const ring = w.user === me ? acc + "55" : "rgba(255,255,255,.05)";
            return (
              <div key={i} className={styles.watchCard} style={{ boxShadow: `inset 0 0 0 1px ${ring}` }}>
                <div className={`${styles.watchHead} flex items-center gap-10`}>
                  <Avatar src={p.avatar} bg={p.color} size={34} />
                  <div className="flex-1 minw-0">
                    <div className={styles.watchName}>{p.name}</div>
                    <div className={`${styles.watchMeta} flex items-center`}>
                      <span className={styles.moodChip} style={{ background: moodBgOf(mc), color: mc }}>{w.mood}</span>
                      <RenderWhen.If isTrue={w.rewatch > 0}>
                        <span className={styles.rewatchChip}>↻ {rewatchLabel(w.rewatch)}</span>
                      </RenderWhen.If>
                      <span className={styles.watchPlatform}>{w.platform}</span>
                    </div>
                  </div>
                  <div className={`${styles.watchScore} flex-none`}>
                    <Stars value={w.rating / 2} acc={acc} size={13} gap={1} />
                    <div className={`mono ${styles.watchRating}`} style={{ color: acc }}>{w.rating.toFixed(1)}</div>
                  </div>
                </div>
                {w.reflect.trim() ? (
                  <div className={styles.reflectText}>{w.reflect}</div>
                ) : (
                  <div className={styles.noNote}>Logged — no written note.</div>
                )}
                <RenderWhen.If isTrue={!!w.momentTitle}>
                  <div className={styles.momentBox}>
                    <div className={`mono ${styles.momentTitle}`} style={{ color: acc }}>◆ {w.momentTitle}</div>
                    <div className={styles.momentWhy}>{w.momentWhy}</div>
                  </div>
                </RenderWhen.If>
              </div>
            );
          })}
        </div>

        {/* facts */}
        <div className={`${styles.factsHead} flex items-center gap-8`}>
          <Label>DID YOU KNOW?</Label>
          <span className={`${styles.hDivider} flex-1`} />
          <span className={`mono ${styles.factsBadge}`}>crew-verified</span>
        </div>
        <div className={`${styles.factList} flex-col`}>
          {e.facts.map((f) => {
            const p = resolvePerson(data.profiles, f.user);
            const cnt = f.confirms.length;
            const isMine = f.confirms.includes(me);
            const status =
              cnt >= 2
                ? { text: "VERIFIED", color: "#57c99a", bg: "#57c99a22", ring: "#57c99a44" }
                : cnt === 0
                ? { text: "PENDING", color: "#8a929e", bg: "rgba(255,255,255,.05)", ring: "rgba(255,255,255,.05)" }
                : { text: "CONFIRMING", color: acc, bg: acc + "22", ring: "rgba(255,255,255,.05)" };
            return (
              <div key={f.id} className={styles.factCard} style={{ boxShadow: `inset 0 0 0 1px ${status.ring}` }}>
                <div className={`${styles.factHead} flex items-center`}>
                  <Avatar src={p.avatar} bg={p.color} size={26} />
                  <span className={`${styles.factBy} flex-1`}>
                    <b className={styles.factByName}>{p.name}</b> shared
                  </span>
                  <span className={`mono ${styles.factStatus} flex-none`} style={{ background: status.bg, color: status.color }}>{status.text}</span>
                </div>
                <div className={styles.factText}>{f.text}</div>
                <div className="flex items-center justify-between">
                  <span className={styles.factConfirms}>{cnt === 0 ? "Needs crew confirms" : cnt + " confirmed"}</span>
                  <button
                    onClick={() => toggleConfirm(f.id)}
                    className={styles.confirmBtn}
                    style={{ border: `1.5px solid ${isMine ? acc : "rgba(255,255,255,.14)"}`, background: isMine ? acc : "transparent", color: isMine ? "#0a0c0f" : "#c6ccd4" }}
                  >
                    {isMine ? "✓ Confirmed" : "Confirm"}
                  </button>
                </div>
              </div>
            );
          })}
          <RenderWhen.If isTrue={e.facts.length === 0}>
            <div className={styles.noFacts}>No facts yet. Know some trivia? Add the first one below.</div>
          </RenderWhen.If>
        </div>
        <div className={`${styles.factInputRow} flex items-center`}>
          <input
            value={factDraft}
            onChange={(ev) => setFactDraft(ev.target.value)}
            placeholder="add a fact or bit of trivia..."
            className={`${styles.inputBare} ${styles.factInput} flex-1`}
          />
          <button onClick={submitFact} className={styles.addFactBtn} style={{ background: factReady ? acc : "#181c22", color: factReady ? "#0a0c0f" : "#5a636f" }}>Add</button>
        </div>

        {/* add / edit your take */}
        {showForm ? (
          <div className={styles.takeForm} style={{ boxShadow: `inset 0 0 0 1.5px ${acc}55` }}>
            <div className={styles.takeTitle}>
              {editing ? "Edit your take" : "You watched this too?"}
            </div>
            <div className={styles.takeSub}>
              {editing ? "The crew average re-derives from your new rating." : "Your rating joins the crew average."}
            </div>
            <div className={`${styles.takeRow} flex items-center gap-12`}>
              <StarPicker value={takeRating} onPick={setTakeRating} acc={acc} size={26} gap={3} />
              <span className={`mono ${styles.takeScore}`} style={{ color: acc }}>{takeRating > 0 ? takeRating * 2 + "/10" : "–/10"}</span>
            </div>
            <div className={`${styles.takeRow} flex items-center gap-12`}>
              <span className={styles.fieldLabel}>Rewatched</span>
              <button onClick={() => setTakeRewatch(Math.max(0, takeRewatch - 1))} className={styles.stepBtn}>−</button>
              <span className={`${styles.rewatchCount} text-center`}>{takeRewatch === 0 ? "First watch" : takeRewatch + "×"}</span>
              <button onClick={() => setTakeRewatch(takeRewatch + 1)} className={styles.stepBtn}>+</button>
            </div>
            <div className={`${styles.chipRow} flex`}>
              {PLATFORM_LIST.map((p) => {
                const sel = takePlatform === p;
                const c = PLATFORM_META[p];
                return (
                  <button key={p} onClick={() => setTakePlatform(p)} className={styles.platformChip} style={{ border: `1.5px solid ${sel ? c : "rgba(255,255,255,.12)"}`, background: sel ? c : "transparent", color: sel ? "#0a0c0f" : "#c6ccd4" }}>{p}</button>
                );
              })}
            </div>
            <div className={`${styles.chipRow} flex`}>
              {MOOD_LIST.map((m) => {
                const sel = takeMood === m;
                const c = MOOD_META[m];
                return (
                  <button key={m} onClick={() => setTakeMood(m)} className={styles.moodPick} style={{ border: `1.5px solid ${sel ? c : "rgba(255,255,255,.12)"}`, background: sel ? c : "transparent", color: sel ? "#0a0c0f" : "#c6ccd4" }}>{m}</button>
                );
              })}
            </div>
            <textarea
              value={takeReflect}
              onChange={(ev) => setTakeReflect(ev.target.value)}
              placeholder="your thoughts..."
              className={`${styles.field} ${styles.reflectArea} w-full`}
            />
            <input
              value={takeMomentTitle}
              onChange={(ev) => setTakeMomentTitle(ev.target.value)}
              placeholder="favorite moment (optional) — e.g. Ep 10 — the rooftop"
              className={`${styles.field} ${styles.momentInput} w-full`}
            />
            <textarea
              value={takeMomentWhy}
              onChange={(ev) => setTakeMomentWhy(ev.target.value)}
              placeholder="why did it hit so hard?"
              className={`${styles.field} ${styles.momentArea} w-full`}
            />
            <button
              onClick={submitTake}
              disabled={busy}
              className={`${styles.submitBtn} w-full`}
              style={{ background: takeReady ? acc : "#181c22", color: takeReady ? "#0a0c0f" : "#5a636f", opacity: busy ? 0.7 : 1 }}
            >
              {takeReady ? (editing ? "Save changes" : "Add my take") : "Rate & pick a mood"}
            </button>
            <RenderWhen.If isTrue={editing}>
              <button onClick={resetForm} className={`${styles.cancelBtn} w-full`}>
                Cancel
              </button>
            </RenderWhen.If>
          </div>
        ) : (
          <div className={`${styles.loggedBanner} flex items-center gap-10`}>
            <span className={`${styles.loggedText} flex-1`} style={{ color: acc }}>✓ Your rating is part of this average</span>
            <button
              onClick={startEdit}
              className={`${styles.editBtn} flex-none`}
              style={{ border: `1.5px solid ${acc}66`, color: acc }}
            >
              ✎ Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
