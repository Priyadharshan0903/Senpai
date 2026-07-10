"use client";

import React from "react";

/* eslint-disable @next/next/no-img-element */
export function Avatar({
  src,
  bg,
  size = 40,
  radius = "50%",
}: {
  src: string;
  bg?: string;
  size?: number;
  radius?: number | string;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        flex: "none",
        background: bg,
        display: "block",
      }}
    >
      <img
        src={src}
        alt=""
        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
      />
    </span>
  );
}

/** The Senpai "books + star" logo mark. Scales via `size`. */
export function LogoMark({ acc, size = 76 }: { acc: string; size?: number }) {
  const s = size / 76; // base is 76
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 21 * s,
        background: "linear-gradient(160deg,#1c222b,#0c0f14)",
        boxShadow:
          "0 14px 34px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.08)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", width: 46 * s, height: 42 * s }}>
        <span
          style={{
            position: "absolute",
            left: 1 * s,
            bottom: 3 * s,
            width: 19 * s,
            height: 27 * s,
            borderRadius: 5 * s,
            background: "linear-gradient(160deg,#3a8f86,#1e3a52)",
            transform: "rotate(-17deg)",
            boxShadow: "0 2px 6px rgba(0,0,0,.4)",
          }}
        />
        <span
          style={{
            position: "absolute",
            right: 1 * s,
            bottom: 3 * s,
            width: 19 * s,
            height: 27 * s,
            borderRadius: 5 * s,
            background: "linear-gradient(160deg,#5b8cc9,#22304a)",
            transform: "rotate(17deg)",
            boxShadow: "0 2px 6px rgba(0,0,0,.4)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: 2 * s,
            transform: "translateX(-50%)",
            width: 20 * s,
            height: 29 * s,
            borderRadius: 5 * s,
            background: acc,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 3px 9px rgba(0,0,0,.5)",
          }}
        >
          <span style={{ color: "#0a0c0f", fontSize: 13 * s, fontWeight: 700 }}>★</span>
        </span>
      </div>
    </div>
  );
}

export function StatusBar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 46,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 26px 0",
        color: "#f3f5f8",
        fontSize: 13,
        letterSpacing: ".3px",
      }}
      className="mono"
    >
      <span style={{ fontWeight: 700 }}>9:41</span>
      <span
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#9aa3af" }}
      >
        <span>5G</span>
        <span
          style={{
            display: "inline-block",
            width: 22,
            height: 11,
            border: "1.5px solid #9aa3af",
            borderRadius: 3,
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: "1.5px",
              right: 6,
              background: "#9aa3af",
              borderRadius: 1,
            }}
          />
        </span>
      </span>
    </div>
  );
}

/** Read-only star row (0-5, supports halves). */
export function Stars({
  value,
  acc,
  size = 13,
  gap = 1,
}: {
  value: number;
  acc: string;
  size?: number;
  gap?: number;
}) {
  const cells = [1, 2, 3, 4, 5].map((i) => (value >= i ? 100 : value >= i - 0.5 ? 50 : 0));
  return (
    <div style={{ display: "flex", gap }}>
      {cells.map((pct, i) => (
        <span
          key={i}
          style={{ position: "relative", fontSize: size, lineHeight: 1, color: "#2a3038" }}
        >
          <span>★</span>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "hidden",
              width: pct + "%",
              color: acc,
            }}
          >
            ★
          </span>
        </span>
      ))}
    </div>
  );
}

/** Interactive star rating: click left/right half to pick .5 / whole. */
export function StarPicker({
  value,
  onPick,
  acc,
  size = 32,
  gap = 4,
}: {
  value: number; // 0-5
  onPick: (v: number) => void;
  acc: string;
  size?: number;
  gap?: number;
}) {
  const cells = [1, 2, 3, 4, 5].map((i) => (value >= i ? 100 : value >= i - 0.5 ? 50 : 0));
  return (
    <div style={{ display: "flex", gap }}>
      {cells.map((pct, idx) => {
        const i = idx + 1;
        return (
          <span
            key={i}
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const half = e.clientX - r.left < r.width / 2;
              onPick(half ? i - 0.5 : i);
            }}
            style={{
              position: "relative",
              cursor: "pointer",
              fontSize: size,
              lineHeight: 1,
              color: "#2a3038",
            }}
          >
            <span>★</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                overflow: "hidden",
                width: pct + "%",
                color: acc,
              }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function PlusIcon({ stroke, size = 20 }: { stroke: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.6} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
