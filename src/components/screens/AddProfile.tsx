"use client";

import React, { useState } from "react";
import { useCanon } from "@/store";
import { createProfile } from "@/lib/api";
import { avatarUrl } from "@/lib/avatar";

/* eslint-disable @next/next/no-img-element */
export function AddProfile() {
  const { acc, switchProfile, enterApp, refresh, flash } = useCanon();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = avatarUrl(name.trim() || "new-profile");

  const create = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      const p = await createProfile(n);
      await refresh();
      enterApp((p as { id: string }).id);
    } catch (e) {
      flash(e instanceof Error ? e.message : "could not create profile");
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        background: "radial-gradient(120% 70% at 50% 0%, #16202b 0%, #0a0c0f 55%)",
        display: "flex",
        flexDirection: "column",
        padding: "0 30px",
        animation: "cnFade .3s ease",
      }}
    >
      <button
        onClick={switchProfile}
        style={{
          marginTop: 60,
          width: 38,
          height: 38,
          borderRadius: 12,
          border: "1.5px solid rgba(255,255,255,.12)",
          background: "transparent",
          color: "#f3f5f8",
          fontSize: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ‹
      </button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "linear-gradient(160deg,#1c222b,#0c0f14)",
            boxShadow: "0 12px 30px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.08)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", width: 40, height: 36 }}>
            <span style={{ position: "absolute", left: 1, bottom: 2, width: 16, height: 23, borderRadius: 4, background: "linear-gradient(160deg,#3a8f86,#1e3a52)", transform: "rotate(-17deg)" }} />
            <span style={{ position: "absolute", right: 1, bottom: 2, width: 16, height: 23, borderRadius: 4, background: "linear-gradient(160deg,#5b8cc9,#22304a)", transform: "rotate(17deg)" }} />
            <span style={{ position: "absolute", left: "50%", bottom: 1, transform: "translateX(-50%)", width: 17, height: 25, borderRadius: 4, background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#0a0c0f", fontSize: 11, fontWeight: 700 }}>★</span>
            </span>
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: 28, color: "#f3f5f8", marginTop: 22, letterSpacing: "-.5px" }}>
          Add your profile
        </div>
        <div style={{ fontSize: 14, color: "#9aa3af", marginTop: 8, lineHeight: 1.5 }}>
          Join the crew — pick a name and you&apos;re in. Your avatar is generated for you.
        </div>
        <div
          style={{
            marginTop: 30,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "6px 6px 6px 8px",
            borderRadius: 16,
            background: "#12161c",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.09)",
          }}
        >
          <span style={{ width: 40, height: 40, borderRadius: "50%", flex: "none", overflow: "hidden", background: acc, display: "block" }}>
            <img src={preview} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="your name"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f3f5f8",
              fontFamily: "var(--font-jakarta)",
              fontSize: 17,
              fontWeight: 600,
            }}
          />
        </div>
      </div>
      <button
        onClick={create}
        style={{
          marginBottom: 44,
          width: "100%",
          padding: 17,
          borderRadius: 16,
          border: "none",
          cursor: "pointer",
          fontWeight: 800,
          fontSize: 16,
          background: acc,
          color: "#0a0c0f",
          opacity: busy ? 0.7 : 1,
        }}
      >
        Create profile &amp; enter
      </button>
    </div>
  );
}
