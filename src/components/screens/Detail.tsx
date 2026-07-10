"use client";

import React, { useEffect, useState } from "react";
import { useSenpai } from "@/store";
import { CoverArt } from "@/components/CoverArt";
import { Avatar, Stars, StarPicker } from "@/components/bits";
import { avg, buildEmotes, resolvePerson, MOOD_META, moodBgOf } from "@/lib/derive";
import { MOOD_LIST, PLATFORM_LIST, PLATFORM_META, rewatchLabel } from "@/lib/theme";
import { postFact, confirmFact, postLog, editLog, addToWatchlist, removeFromWatchlist } from "@/lib/api";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mono" style={{ fontSize: 10, color: "#8a929e", letterSpacing: "1.5px" }}>
    {children}
  </div>
);

export function Detail() {
  const { acc, data, me, detailId, closeDetail, reactEmote, refresh, flash } = useSenpai();

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
    setTakeReflect(myWatch.reflect === "(no thoughts added)" ? "" : myWatch.reflect);
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
    <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "#0a0c0f", overflowY: "auto", animation: "cnSlide .28s cubic-bezier(.2,.8,.2,1)" }}>
      {/* hero */}
      <div style={{ position: "relative", height: 280, background: `linear-gradient(155deg,${e.c1},${e.c2})` }}>
        <CoverArt src={e.cover} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,#0a0c0f 3%,rgba(10,12,15,.35) 45%,transparent 72%)", pointerEvents: "none" }} />
        <button onClick={closeDetail} style={{ position: "absolute", top: 54, left: 16, width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(8,10,13,.55)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>‹</button>
        {!mine && (
          <button
            onClick={toggleBookmark}
            title={myWatchItem ? "Remove from watchlist" : "Save to watchlist"}
            style={{ position: "absolute", top: 54, right: 16, width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: myWatchItem ? acc : "rgba(8,10,13,.55)", backdropFilter: "blur(6px)", color: myWatchItem ? "#0a0c0f" : "#fff", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}
          >
            {myWatchItem ? "◆" : "◇"}
          </button>
        )}
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 20, background: "rgba(8,10,13,.6)", backdropFilter: "blur(8px)", color: acc, fontWeight: 800, fontSize: 16, pointerEvents: "none" }}>
          <span>★</span>
          <span className="mono">{avg(e).toFixed(1)}</span>
        </div>
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, pointerEvents: "none" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
            {e.genres.map((g) => (
              <span key={g} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, background: "rgba(255,255,255,.15)", color: "#e7eaef" }}>{g}</span>
            ))}
          </div>
          <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-.8px", color: "#fff", lineHeight: 1.02 }}>{e.title}</div>
          <div className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,.72)", marginTop: 5 }}>
            {e.year} · {e.ep} · {e.watches.length} logged
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 40px" }}>
        {/* rating summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 16, background: "#12161c", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)", marginBottom: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: acc, fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{avg(e).toFixed(1)}</div>
            <div className="mono" style={{ fontSize: 9, color: "#8a929e", marginTop: 3 }}>CREW AVG</div>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,.08)" }} />
          <div style={{ flex: 1, fontSize: 12.5, color: "#9aa3af", lineHeight: 1.4 }}>
            Averaged from <b style={{ color: "#f3f5f8" }}>{e.watches.length}</b> {e.watches.length === 1 ? "log" : "logs"}. Every rating below counts toward it.
          </div>
        </div>

        {/* emotes */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 22 }}>
          {emotes.map((em) => (
            <button key={em.emoji} onClick={() => reactEmote(e.id, em.emoji)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 20, border: "none", cursor: "pointer", background: em.bg, boxShadow: em.ring, transition: "transform .1s" }}>
              <span style={{ fontSize: 16 }}>{em.emoji}</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: em.fg }}>{em.count}</span>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label>WHO LOGGED IT · {e.watches.length}</Label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {e.watches.map((w, i) => {
            const p = resolvePerson(data.profiles, w.user);
            const mc = MOOD_META[w.mood] || "#8a929e";
            const ring = w.user === me ? acc + "55" : "rgba(255,255,255,.05)";
            return (
              <div key={i} style={{ borderRadius: 16, padding: 15, background: "#12161c", boxShadow: `inset 0 0 0 1px ${ring}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
                  <Avatar src={p.avatar} bg={p.color} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f3f5f8" }}>{p.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: moodBgOf(mc), color: mc }}>{w.mood}</span>
                      {w.rewatch > 0 && (
                        <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,.06)", color: "#c6ccd4" }}>↻ {rewatchLabel(w.rewatch)}</span>
                      )}
                      <span style={{ fontSize: 10.5, color: "#8a929e" }}>{w.platform}</span>
                    </div>
                  </div>
                  <div style={{ flex: "none", textAlign: "right" }}>
                    <Stars value={w.rating / 2} acc={acc} size={13} gap={1} />
                    <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: acc, marginTop: 3 }}>{w.rating.toFixed(1)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#c6ccd4" }}>{w.reflect}</div>
                {w.momentTitle && (
                  <div style={{ marginTop: 11, borderRadius: 11, padding: "11px 13px", background: "#0c0f14" }}>
                    <div className="mono" style={{ fontSize: 9.5, color: acc, letterSpacing: "1px", marginBottom: 4 }}>◆ {w.momentTitle}</div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#9aa3af" }}>{w.momentWhy}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* facts */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "24px 0 14px" }}>
          <Label>DID YOU KNOW?</Label>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
          <span className="mono" style={{ fontSize: 10, color: "#5a636f" }}>crew-verified</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
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
              <div key={f.id} style={{ borderRadius: 14, padding: "13px 14px", background: "#12161c", boxShadow: `inset 0 0 0 1px ${status.ring}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                  <Avatar src={p.avatar} bg={p.color} size={26} />
                  <span style={{ flex: 1, fontSize: 12, color: "#8a929e" }}>
                    <b style={{ color: "#c6ccd4" }}>{p.name}</b> shared
                  </span>
                  <span className="mono" style={{ flex: "none", padding: "3px 9px", borderRadius: 10, fontSize: 9.5, fontWeight: 700, background: status.bg, color: status.color }}>{status.text}</span>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#e7eaef", marginBottom: 11 }}>{f.text}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11.5, color: "#8a929e" }}>{cnt === 0 ? "Needs crew confirms" : cnt + " confirmed"}</span>
                  <button
                    onClick={() => toggleConfirm(f.id)}
                    style={{ padding: "6px 13px", borderRadius: 16, border: `1.5px solid ${isMine ? acc : "rgba(255,255,255,.14)"}`, background: isMine ? acc : "transparent", color: isMine ? "#0a0c0f" : "#c6ccd4", cursor: "pointer", fontWeight: 700, fontSize: 11.5 }}
                  >
                    {isMine ? "✓ Confirmed" : "Confirm"}
                  </button>
                </div>
              </div>
            );
          })}
          {e.facts.length === 0 && (
            <div style={{ color: "#5a636f", fontSize: 12.5, padding: "2px 2px 4px" }}>No facts yet. Know some trivia? Add the first one below.</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 6px 6px 15px", borderRadius: 14, background: "#101822", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.08)" }}>
          <input
            value={factDraft}
            onChange={(ev) => setFactDraft(ev.target.value)}
            placeholder="add a fact or bit of trivia..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f3f5f8", fontFamily: "var(--font-jakarta)", fontSize: 13.5 }}
          />
          <button onClick={submitFact} style={{ padding: "9px 15px", borderRadius: 11, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5, background: factReady ? acc : "#181c22", color: factReady ? "#0a0c0f" : "#5a636f" }}>Add</button>
        </div>

        {/* add / edit your take */}
        {showForm ? (
          <div style={{ marginTop: 22, borderRadius: 16, padding: 16, background: "#101822", boxShadow: `inset 0 0 0 1.5px ${acc}55` }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#f3f5f8", marginBottom: 2 }}>
              {editing ? "Edit your take" : "You watched this too?"}
            </div>
            <div style={{ fontSize: 12.5, color: "#8a929e", marginBottom: 15 }}>
              {editing ? "The crew average re-derives from your new rating." : "Your rating joins the crew average."}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <StarPicker value={takeRating} onPick={setTakeRating} acc={acc} size={26} gap={3} />
              <span className="mono" style={{ fontWeight: 700, fontSize: 16, color: acc }}>{takeRating > 0 ? takeRating * 2 + "/10" : "–/10"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#8a929e" }}>Rewatched</span>
              <button onClick={() => setTakeRewatch(Math.max(0, takeRewatch - 1))} style={smallStep}>−</button>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#c6ccd4", minWidth: 74, textAlign: "center" }}>{takeRewatch === 0 ? "First watch" : takeRewatch + "×"}</span>
              <button onClick={() => setTakeRewatch(takeRewatch + 1)} style={smallStep}>+</button>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {PLATFORM_LIST.map((p) => {
                const sel = takePlatform === p;
                const c = PLATFORM_META[p];
                return (
                  <button key={p} onClick={() => setTakePlatform(p)} style={{ padding: "7px 12px", borderRadius: 11, border: `1.5px solid ${sel ? c : "rgba(255,255,255,.12)"}`, background: sel ? c : "transparent", color: sel ? "#0a0c0f" : "#c6ccd4", cursor: "pointer", fontWeight: 700, fontSize: 11.5 }}>{p}</button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {MOOD_LIST.map((m) => {
                const sel = takeMood === m;
                const c = MOOD_META[m];
                return (
                  <button key={m} onClick={() => setTakeMood(m)} style={{ padding: "7px 13px", borderRadius: 18, border: `1.5px solid ${sel ? c : "rgba(255,255,255,.12)"}`, background: sel ? c : "transparent", color: sel ? "#0a0c0f" : "#c6ccd4", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>{m}</button>
                );
              })}
            </div>
            <textarea
              value={takeReflect}
              onChange={(ev) => setTakeReflect(ev.target.value)}
              placeholder="your thoughts..."
              style={{ width: "100%", height: 70, padding: 13, borderRadius: 12, background: "#0c0f14", border: "none", outline: "none", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.08)", color: "#f3f5f8", fontFamily: "var(--font-jakarta)", fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}
            />
            <input
              value={takeMomentTitle}
              onChange={(ev) => setTakeMomentTitle(ev.target.value)}
              placeholder="favorite moment (optional) — e.g. Ep 10 — the rooftop"
              style={{ width: "100%", padding: "12px 13px", borderRadius: 12, background: "#0c0f14", border: "none", outline: "none", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.08)", color: "#f3f5f8", fontFamily: "var(--font-jakarta)", fontSize: 13, fontWeight: 600, marginBottom: 10 }}
            />
            <textarea
              value={takeMomentWhy}
              onChange={(ev) => setTakeMomentWhy(ev.target.value)}
              placeholder="why did it hit so hard?"
              style={{ width: "100%", height: 54, padding: "12px 13px", borderRadius: 12, background: "#0c0f14", border: "none", outline: "none", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.08)", color: "#f3f5f8", fontFamily: "var(--font-jakarta)", fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}
            />
            <button
              onClick={submitTake}
              disabled={busy}
              style={{ width: "100%", padding: 14, borderRadius: 13, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, background: takeReady ? acc : "#181c22", color: takeReady ? "#0a0c0f" : "#5a636f", opacity: busy ? 0.7 : 1 }}
            >
              {takeReady ? (editing ? "Save changes" : "Add my take") : "Rate & pick a mood"}
            </button>
            {editing && (
              <button
                onClick={resetForm}
                style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 13, border: "1.5px solid rgba(255,255,255,.12)", cursor: "pointer", fontWeight: 700, fontSize: 13, background: "transparent", color: "#8a929e" }}
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "#101822" }}>
            <span style={{ flex: 1, color: acc, fontWeight: 700, fontSize: 13.5 }}>✓ Your rating is part of this average</span>
            <button
              onClick={startEdit}
              style={{ flex: "none", padding: "8px 15px", borderRadius: 11, border: `1.5px solid ${acc}66`, cursor: "pointer", fontWeight: 700, fontSize: 12.5, background: "transparent", color: acc }}
            >
              ✎ Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const smallStep: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 9,
  border: "1.5px solid rgba(255,255,255,.12)",
  background: "transparent",
  color: "#f3f5f8",
  fontSize: 18,
  cursor: "pointer",
};
