"use client";

import React from "react";
import { useSenpai } from "@/store";
import { resolvePerson } from "@/lib/derive";

/* eslint-disable @next/next/no-img-element */
export function Friends() {
  const { acc, data, me, setScreen, switchProfile, viewUserList } = useSenpai();
  if (!data || !me) return null;
  const meP = resolvePerson(data.profiles, me);

  const friends = data.profiles
    .filter((p) => p.id !== me)
    .map((p) => {
      const logged = data.entries.filter((e) => e.watches.some((w) => w.user === p.id)).length;
      const listed = data.watchlist.filter((w) => w.user === p.id).length;
      return { ...p, loggedLabel: logged + " logged · " + listed + " on watchlist" };
    });

  return (
    <div style={{ padding: "8px 18px 24px" }}>
      <div className="mono" style={{ fontSize: 10, color: acc, letterSpacing: "1.5px" }}>YOUR CREW</div>
      <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: "-.8px", color: "#f3f5f8", margin: "2px 0 18px" }}>Friends</div>

      {/* me card */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, background: "#12161c", boxShadow: `inset 0 0 0 1.5px ${acc}44`, marginBottom: 22 }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", flex: "none", background: acc, display: "block" }}>
          <img src={meP.avatar} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#f3f5f8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {meP.name} <span style={{ fontSize: 11, fontWeight: 600, color: acc }}>· you</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#8a929e", marginTop: 2 }}>your profile &amp; ranks</div>
        </div>
        <button onClick={() => setScreen("profile")} style={{ flex: "none", padding: "0 12px", height: 34, borderRadius: 11, border: "1.5px solid rgba(255,255,255,.14)", background: "transparent", color: "#c6ccd4", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Profile</button>
        <button onClick={switchProfile} style={{ flex: "none", padding: "0 12px", height: 34, borderRadius: 11, border: "none", background: acc, color: "#0a0c0f", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Switch</button>
      </div>

      <div className="mono" style={{ fontSize: 10, color: "#8a929e", letterSpacing: "1.5px", marginBottom: 12 }}>THE CREW</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {friends.map((f) => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: 11, borderRadius: 14, background: "#12161c", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.05)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flex: "none", background: f.color, display: "block" }}>
              <img src={f.avatar} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#f3f5f8" }}>{f.name}</div>
              <div style={{ fontSize: 11.5, color: "#8a929e", marginTop: 2 }}>{f.loggedLabel}</div>
            </div>
            <button onClick={() => viewUserList(f.id)} style={{ flex: "none", padding: "0 13px", height: 34, borderRadius: 11, border: "1.5px solid rgba(255,255,255,.14)", background: "transparent", color: "#c6ccd4", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Watchlist</button>
          </div>
        ))}
      </div>
    </div>
  );
}
