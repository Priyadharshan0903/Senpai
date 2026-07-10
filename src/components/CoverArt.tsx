"use client";

import React from "react";

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
    return (
      <img
        src={src}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: radius,
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,.5)",
        fontSize: 12,
        textAlign: "center",
        padding: 8,
      }}
    >
      {placeholder}
    </div>
  );
}
