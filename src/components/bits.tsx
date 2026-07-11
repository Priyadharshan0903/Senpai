"use client";

import React from "react";
import styles from "./bits.module.css";

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
      className="avatar-round flex-none"
      style={{ width: size, height: size, borderRadius: radius, background: bg }}
    >
      <img src={src} alt="" className="img-cover" />
    </span>
  );
}

/** The Senpai "books + star" logo mark. Scales via `size`. */
export function LogoMark({ acc, size = 76 }: { acc: string; size?: number }) {
  const s = size / 76; // base is 76
  return (
    <div
      className={`${styles.logoMark} relative flex-center`}
      style={{ width: size, height: size, borderRadius: 21 * s }}
    >
      <div className="relative" style={{ width: 46 * s, height: 42 * s }}>
        <span
          className={styles.bookLeft}
          style={{ left: 1 * s, bottom: 3 * s, width: 19 * s, height: 27 * s, borderRadius: 5 * s }}
        />
        <span
          className={styles.bookRight}
          style={{ right: 1 * s, bottom: 3 * s, width: 19 * s, height: 27 * s, borderRadius: 5 * s }}
        />
        <span
          className={`${styles.bookCenter} flex-center`}
          style={{ bottom: 2 * s, width: 20 * s, height: 29 * s, borderRadius: 5 * s, background: acc }}
        >
          <span className={styles.bookStar} style={{ fontSize: 13 * s }}>★</span>
        </span>
      </div>
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
    <div className="flex" style={{ gap }}>
      {cells.map((pct, i) => (
        <span key={i} className={`${styles.starCell} relative`} style={{ fontSize: size }}>
          <span>★</span>
          <span className={styles.starFill} style={{ width: pct + "%", color: acc }}>
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
    <div className="flex" style={{ gap }}>
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
            className={`${styles.starCell} relative pointer`}
            style={{ fontSize: size }}
          >
            <span>★</span>
            <span className={styles.starFill} style={{ width: pct + "%", color: acc }}>
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
