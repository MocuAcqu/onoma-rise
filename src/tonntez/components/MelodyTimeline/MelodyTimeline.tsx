import { useEffect, useRef } from "react";
import PitchUtils from "../../core/PitchUtils";
import type { MelodyEvent } from "../../type";
import { COLORS } from "../../constants";
import { styles } from "./styles";

type Props = {
  melodyEvents:          MelodyEvent[];
  activeMelodyEventId:   string | null;
  playbackMelodyEventId: string | null;
  recentEventIds:        Set<string>;
  onClickEvent:          (event: MelodyEvent) => void;
};

export default function MelodyTimeline({ melodyEvents, activeMelodyEventId, playbackMelodyEventId, recentEventIds, onClickEvent }:Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!playbackMelodyEventId) return;
    const list = listRef.current;
    const item = eventRefs.current.get(playbackMelodyEventId);
    if (!list || !item) return;

    const targetTop = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  }, [playbackMelodyEventId]);

  return (
    <div style={styles.timelinePanel}>
      <div style={styles.timelineTitle}>Melody Timeline</div>
      <div style={styles.timelineDesc}> Click a segment to activate its Tonnetz note.</div>
      <div ref={listRef} style={styles.timelineList}>
        {melodyEvents.map((evt, idx) => {
          const isActive = activeMelodyEventId === evt.id || playbackMelodyEventId === evt.id;
          const isRecent = recentEventIds.has(evt.id);
          return (
            <button
              key={evt.id}
              ref={(element) => {
                if (element) eventRefs.current.set(evt.id, element);
                else eventRefs.current.delete(evt.id);
              }}
              onClick={() => onClickEvent(evt)}
              style={{
                ...styles.timelineItem,
                background: isActive
                  ? "linear-gradient(90deg, rgba(236,72,153,0.14) 0%, rgba(124,58,237,0.14) 100%)"
                  : isRecent
                  ? "rgba(124,58,237,0.06)"
                  : "#ffffff",
                borderColor: isActive ? "#a855f7" : isRecent ? COLORS.accentBorder : "rgba(124,58,237,0.12)",
                boxShadow: isActive ? "0 8px 18px rgba(124,58,237,0.16)" : "none",
              }}
            >
              <div style={styles.timelineTop}>
                <span style={styles.timelineSegment}>SEG {idx + 1}</span>
                <span style={styles.timelineTime}>
                  {PitchUtils.formatTime(evt.start)} – {PitchUtils.formatTime(evt.end)}
                </span>
              </div>
              <div style={{ ...styles.timelinePitch, color: isActive ? "#db2777" : COLORS.recentText }}>
                {evt.pitch}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
