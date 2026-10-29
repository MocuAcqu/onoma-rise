import { useCallback, useState } from "react";

import type { HarmonicTimelineEvent } from "../../score/harmonicAnalysis";
import type { MelodyEvent } from "../../types";
import HarmonicTimeline from "../HarmonicTimeline";
import MelodyTimeline from "../MelodyTimeline";
import { styles } from "./styles";

type TimelineTab = "melody" | "harmony";

type Props = {
  melodyEvents: MelodyEvent[];
  playbackMelodyEventId: string | null;
  recentMelodyEventIds: Set<string>;
  harmonicEvents: HarmonicTimelineEvent[];
  activeHarmonicEventId: string | null;
  onSeek: (position: number) => void;
};

/**
 * Owns the score timeline's presentation state. Playback and analysis remain
 * outside this component; selecting either kind of event only requests a seek.
 */
export default function ScoreTimelineDock({
  melodyEvents,
  playbackMelodyEventId,
  recentMelodyEventIds,
  harmonicEvents,
  activeHarmonicEventId,
  onSeek,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TimelineTab>("melody");

  const handleMelodySelect = useCallback(
    (event: MelodyEvent) => onSeek(event.start),
    [onSeek],
  );
  const handleHarmonySelect = useCallback(
    (event: HarmonicTimelineEvent) => onSeek(event.start),
    [onSeek],
  );

  return (
    <div style={styles.dock}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="score-tonnetz-timeline"
        onClick={() => setIsOpen((open) => !open)}
        style={styles.toggle}
      >
        {isOpen ? "收合時間軸 ▾" : "展開時間軸 ▴"}
      </button>

      {isOpen && (
        <div id="score-tonnetz-timeline" style={styles.body}>
          <div style={styles.tabs} role="tablist" aria-label="樂譜時間軸">
            <TimelineTabButton
              isActive={activeTab === "melody"}
              onClick={() => setActiveTab("melody")}
            >
              上譜表
            </TimelineTabButton>
            <TimelineTabButton
              isActive={activeTab === "harmony"}
              onClick={() => setActiveTab("harmony")}
            >
              和聲
            </TimelineTabButton>
          </div>

          {activeTab === "melody" ? (
            <MelodyTimeline
              melodyEvents={melodyEvents}
              activeMelodyEventId={null}
              playbackMelodyEventId={playbackMelodyEventId}
              recentEventIds={recentMelodyEventIds}
              onClickEvent={handleMelodySelect}
              compact
            />
          ) : (
            <HarmonicTimeline
              events={harmonicEvents}
              activeEventId={activeHarmonicEventId}
              onClickEvent={handleHarmonySelect}
            />
          )}
        </div>
      )}
    </div>
  );
}

type TimelineTabButtonProps = {
  children: string;
  isActive: boolean;
  onClick: () => void;
};

function TimelineTabButton({ children, isActive, onClick }: TimelineTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      style={{
        ...styles.tab,
        ...(isActive ? styles.activeTab : {}),
      }}
    >
      {children}
    </button>
  );
}
