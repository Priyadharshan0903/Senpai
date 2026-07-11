"use client";

import React from "react";
import { useSenpai } from "@/store";
import { LogoMark } from "@/components/bits";
import { RenderWhen } from "@/components/RenderWhen";
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
import { ActivityPanel } from "@/components/ActivityPanel";
import styles from "./SenpaiApp.module.css";

function Splash({ acc, children }: { acc: string; children: React.ReactNode }) {
  return (
    <div className={styles.splash}>
      <LogoMark acc={acc} size={64} />
      {children}
    </div>
  );
}

export function SenpaiApp() {
  const { acc, loading, error, stage, screen, detailId, toast, refresh, activityOpen } = useSenpai();
  return (
    <div className={styles.shell}>
      <RenderWhen.If isTrue={loading}>
        <Splash acc={acc}>
          <div className={`mono ${styles.splashHint}`}>LOADING THE JOURNAL...</div>
        </Splash>
      </RenderWhen.If>

      <RenderWhen.If isTrue={!loading && !!error}>
        <Splash acc={acc}>
          <div className={styles.splashTitle}>Can&apos;t reach the journal</div>
          <div className={styles.splashBody}>{error}</div>
          <button onClick={refresh} className={styles.retryBtn}>
            Retry
          </button>
        </Splash>
      </RenderWhen.If>

      <RenderWhen.If isTrue={!loading && !error}>
        <RenderWhen.If isTrue={stage === "pick"}>
          <Picker />
        </RenderWhen.If>
        <RenderWhen.If isTrue={stage === "add"}>
          <AddProfile />
        </RenderWhen.If>

        <RenderWhen.If isTrue={stage === "app"}>
          {/* Feed owns its own scroll (pinned header); other screens scroll here */}
          <div className={`${styles.content} ${screen === "feed" ? styles.contentPinned : ""}`}>
            <RenderWhen.If isTrue={screen === "feed"}>
              <Feed />
            </RenderWhen.If>
            <RenderWhen.If isTrue={screen === "ranked"}>
              <Ranked />
            </RenderWhen.If>
            <RenderWhen.If isTrue={screen === "watchlist"}>
              <Watchlist />
            </RenderWhen.If>
            <RenderWhen.If isTrue={screen === "friends"}>
              <Friends />
            </RenderWhen.If>
            <RenderWhen.If isTrue={screen === "add"}>
              <Add />
            </RenderWhen.If>
            <RenderWhen.If isTrue={screen === "profile"}>
              <Profile />
            </RenderWhen.If>
          </div>
          <RenderWhen.If isTrue={!!detailId}>
            <Detail />
          </RenderWhen.If>
          <BottomNav />
          <RenderWhen.If isTrue={activityOpen}>
            <ActivityPanel />
          </RenderWhen.If>
        </RenderWhen.If>
      </RenderWhen.If>

      <RenderWhen.If isTrue={!!toast}>
        <div className={styles.toast}>{toast}</div>
      </RenderWhen.If>
    </div>
  );
}
