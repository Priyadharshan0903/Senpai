"use client";

import { useEffect, useState } from "react";
import { SenpaiProvider } from "@/store";
import { SenpaiApp } from "@/components/SenpaiApp";

/**
 * Shell: on phone-sized viewports (or when installed as a PWA) the app fills
 * the screen; on desktop it sits inside the decorative device frame from the
 * design prototype.
 */
export default function Page() {
  const [framed, setFramed] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 500px) and (min-height: 900px)");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const update = () => setFramed(mq.matches && !standalone);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // register the service worker
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  if (framed === null) {
    return <div style={{ minHeight: "100vh", background: "#070809" }} />;
  }

  if (!framed) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#0a0c0f" }}>
        <SenpaiProvider>
          <SenpaiApp />
        </SenpaiProvider>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 12px",
        background:
          "radial-gradient(130% 90% at 50% -10%, #14171d 0%, #0a0c0f 50%, #070809 100%)",
        backgroundColor: "#070809",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 390,
          height: 844,
          borderRadius: 48,
          padding: 11,
          background: "linear-gradient(160deg,#1c2128,#0a0c0f 60%)",
          boxShadow: "0 34px 90px rgba(0,0,0,.75), inset 0 0 0 1px rgba(255,255,255,.06)",
        }}
      >
        {/* notch */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: "50%",
            transform: "translateX(-50%)",
            width: 112,
            height: 26,
            background: "#070809",
            borderRadius: "0 0 16px 16px",
            zIndex: 60,
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 38,
            overflow: "hidden",
            background: "#0a0c0f",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.06)",
          }}
        >
          <SenpaiProvider>
            <SenpaiApp />
          </SenpaiProvider>
        </div>
      </div>
    </div>
  );
}
