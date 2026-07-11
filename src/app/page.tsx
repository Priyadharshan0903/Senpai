"use client";

import { useEffect, useState } from "react";
import { SenpaiProvider } from "@/store";
import { SenpaiApp } from "@/components/SenpaiApp";
import styles from "./page.module.css";

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
    return <div className={styles.boot} />;
  }

  if (!framed) {
    return (
      <div className={styles.fullscreen}>
        <SenpaiProvider>
          <SenpaiApp />
        </SenpaiProvider>
      </div>
    );
  }

  return (
    <div className={`${styles.stage} flex-center`}>
      <div className={`${styles.frame} relative`}>
        {/* notch */}
        <div className={styles.notch} />
        <div className={`${styles.screen} relative w-full h-full overflow-hidden`}>
          <SenpaiProvider>
            <SenpaiApp />
          </SenpaiProvider>
        </div>
      </div>
    </div>
  );
}
