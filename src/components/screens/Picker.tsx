"use client";

import React from "react";
import { useSenpai } from "@/store";
import { LogoMark } from "@/components/bits";

/* eslint-disable @next/next/no-img-element */
export function Picker() {
  const { acc, data, selectProfile, openAddProfile } = useSenpai();
  const profiles = data?.profiles || [];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        background: "radial-gradient(120% 70% at 50% 0%, #16202b 0%, #0a0c0f 55%)",
        overflowY: "auto",
        animation: "cnFade .3s ease",
      }}
    >
      <div
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "60px 26px 40px",
        }}
      >
        <LogoMark acc={acc} size={76} />
        <div
          style={{
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: "-.8px",
            color: "#f3f5f8",
            marginTop: 16,
          }}
        >
          Senpai
        </div>
        <div style={{ fontSize: 12.5, color: "#8a929e", marginTop: 4 }}>
          the shared anime journal
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#f3f5f8",
            marginTop: 34,
            marginBottom: 22,
          }}
        >
          Who&apos;s watching?
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "22px 14px",
            width: "100%",
          }}
        >
          {profiles.map((p) => (
            <div
              key={p.id}
              onClick={() => selectProfile(p.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 9,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: p.color,
                  boxShadow: "0 8px 20px rgba(0,0,0,.45)",
                }}
              >
                <img
                  src={p.avatar}
                  alt=""
                  style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#c6ccd4" }}>{p.name}</span>
            </div>
          ))}
          <div
            onClick={openAddProfile}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 22,
                border: "2px dashed rgba(255,255,255,.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#5f6773" strokeWidth={2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#8a929e" }}>Add profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
