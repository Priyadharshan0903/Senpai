"use client";

import React from "react";
import styles from "./CoverArt.module.css";

/* eslint-disable @next/next/no-img-element */
/**
 * Replaces the prototype's <image-slot> web component: shows the cover image
 * when present, otherwise a centered placeholder over the gradient parent.
 */
export function CoverArt({
  src,
  placeholder = "drop cover art",
  radius,
}: {
  src?: string;
  placeholder?: string;
  radius?: number;
}) {
  if (src) {
    return <img src={src} alt="" className="absolute-fill img-cover" style={{ borderRadius: radius }} />;
  }
  return (
    <div className={`${styles.placeholder} absolute-fill flex-center text-center`}>
      {placeholder}
    </div>
  );
}
