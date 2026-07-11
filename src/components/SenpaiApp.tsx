"use client";

import React from "react";
import { useSenpai } from "@/store";
import { LogoMark } from "@/components/bits";
import { Picker } from "@/components/screens/Picker";
import { AddProfile } from "@/components/screens/AddProfile";
import { Feed } from "@/components/screens/Feed";
import { Ranked } from "@/components/screens/Ranked";
import { Watchlist } from "@/components/screens/Watchlist";
import { Friends } from "@/components/screens/Friends";
import { Profile } from "@/components/screens/Profile";
import { Add } from "@/components/screens/Add";
import { Detail } from "@/components/screens/Detail";
import { BottomNav } from "@/components/BottomNav";

function Splash({ acc, children }: { acc: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        background: "radial-gradient(120% 70% at 50% 0%, #16202b 0%, #0a0c0f 55%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 30,
        textAlign: "center",
      }}
    >
      <LogoMark acc={acc} size={64} />
      {children}
    </div>
  );
}

export function SenpaiApp() {
  const { acc, data, loading, error, stage, screen, detailId, toast, refresh } = useSenpai();
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#0a0c0f",
      }}
    >
      {loading && (
        <Splash acc={acc}>
          <div className="mono" style={{ fontSize: 11, color: "#8a929e", letterSpacing: "1.5px" }}>LOADING THE JOURNAL...</div>
        </Splash>
      )}

      {!loading && error && (
        <Splash acc={acc}>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#f3f5f8" }}>Can&apos;t reach the journal</div>
          <div style={{ fontSize: 13, color: "#8a929e", lineHeight: 1.5, maxWidth: 280 }}>
            {error}
          </div>
          <button onClick={refresh} style={{ padding: "12px 26px", borderRadius: 13, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14, background: acc, color: "#0a0c0f" }}>Retry</button>
        </Splash>
      )}

      {!loading && !error && (
        <>
          {stage === "pick" && <Picker />}
          {stage === "add" && <AddProfile />}

          {stage === "app" && (
            <>
              {/* Feed owns its own scroll (pinned header); other screens scroll here */}
              <div
                style={{
                  position: "absolute",
                  top: "env(safe-area-inset-top, 0px)",
                  left: 0,
                  right: 0,
                  bottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
                  overflowY: screen === "feed" ? "hidden" : "auto",
                  overflowX: "hidden",
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                {screen === "feed" && <Feed />}
                {screen === "ranked" && <Ranked />}
                {screen === "watchlist" && <Watchlist />}
                {screen === "friends" && <Friends />}
                {screen === "add" && <Add />}
                {screen === "profile" && <Profile />}
              </div>
              {detailId && <Detail />}
              <BottomNav />
            </>
          )}
        </>
      )}

      {/* toast */}
      {toast && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(74px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
            padding: "12px 22px",
            borderRadius: 26,
            background: acc,
            color: "#0a0c0f",
            fontWeight: 800,
            fontSize: 13.5,
            whiteSpace: "nowrap",
            boxShadow: "0 10px 30px rgba(91,140,201,.4)",
            animation: "cnPop .25s ease",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
