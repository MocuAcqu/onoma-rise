import { useState } from "react";
import type { MelodyEvent } from "../../types";
import { styles } from "./styles";

const COLLAPSED_NOTE_COUNT = 24;

type Props = {
  events: MelodyEvent[];
  isPlaying: boolean;
  isPaused: boolean;
  disabled: boolean;
  activeEventId: string | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

export default function MelodyPlaybackControls({
  events,
  isPlaying,
  isPaused,
  disabled,
  activeEventId,
  onPlay,
  onPause,
  onResume,
  onStop,
}: Props) {
  const [sequenceExpanded, setSequenceExpanded] = useState(false);
  const handlePrimaryAction = () => {
    if (!isPlaying) onPlay();
    else if (isPaused) onResume();
    else onPause();
  };

  const label = !isPlaying ? "▶ 播放" : isPaused ? "▶ 繼續" : "⏸ 暫停";
  const canCollapse = events.length > COLLAPSED_NOTE_COUNT;
  const activeIndex = events.findIndex((event) => event.id === activeEventId);
  const previewStart = activeIndex >= COLLAPSED_NOTE_COUNT
    ? Math.min(
        events.length - COLLAPSED_NOTE_COUNT,
        Math.max(0, activeIndex - Math.floor(COLLAPSED_NOTE_COUNT / 2)),
      )
    : 0;
  const visibleEvents = sequenceExpanded || !canCollapse
    ? events
    : events.slice(previewStart, previewStart + COLLAPSED_NOTE_COUNT);

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <button
          onClick={handlePrimaryAction}
          disabled={disabled}
          style={{
            ...styles.primaryButton,
            opacity: disabled ? 0.4 : 1,
            ...(isPlaying && !isPaused ? styles.pauseButton : {}),
          }}
        >
          {label}
        </button>

        {isPlaying && (
          <button onClick={onStop} style={styles.stopButton}>⏹ 停止</button>
        )}
      </div>

      <div style={styles.sequenceHeader}>
        <span style={styles.sequenceLabel}>音符序列</span>
        {canCollapse && (
          <button
            type="button"
            style={styles.sequenceToggle}
            aria-expanded={sequenceExpanded}
            onClick={() => setSequenceExpanded((expanded) => !expanded)}
          >
            {sequenceExpanded ? "收合" : `展開全部（${events.length}）`}
          </button>
        )}
      </div>

      <div style={styles.sequence}>
        {!sequenceExpanded && previewStart > 0 && <span>… → </span>}
        {visibleEvents.map((event, index) => (
          <span key={event.id}>
            <span style={event.id === activeEventId ? styles.sequenceCurrent : undefined}>
              {event.pitch}
            </span>
            {index < visibleEvents.length - 1 && " → "}
          </span>
        ))}
        {!sequenceExpanded && previewStart + visibleEvents.length < events.length && (
          <span> → …</span>
        )}
      </div>
    </div>
  );
}
