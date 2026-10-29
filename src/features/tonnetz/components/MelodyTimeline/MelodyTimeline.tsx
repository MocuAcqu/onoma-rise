import { memo, useCallback, useEffect, useRef } from "react";
import type { MelodyEvent } from "../../types";
import { COLORS } from "../../config";
import { styles } from "./styles";

type Props = {
  melodyEvents:          MelodyEvent[];
  activeMelodyEventId:   string | null;
  playbackMelodyEventId: string | null;
  recentEventIds:        Set<string>;
  onClickEvent:          (event: MelodyEvent) => void;
  compact?:              boolean;
};

function MelodyTimeline({ melodyEvents, activeMelodyEventId, playbackMelodyEventId, recentEventIds, onClickEvent, compact = false }:Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef(new Map<string, HTMLButtonElement>());
  const registerEventElement = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (element) eventRefs.current.set(id, element);
    else eventRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (!playbackMelodyEventId) return;
    const list = listRef.current;
    const item = eventRefs.current.get(playbackMelodyEventId);
    if (!list || !item) return;

    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const centerDelta = itemRect.top + itemRect.height / 2
      - (listRect.top + listRect.height / 2);
    list.scrollTo({ top: Math.max(0, list.scrollTop + centerDelta), behavior: "auto" });
  }, [playbackMelodyEventId]);

  return (
    <div style={{
      ...styles.timelinePanel,
      ...(compact ? styles.compactTimelinePanel : {}),
    }}>
      <div ref={listRef} style={styles.timelineList}>
        {compact && melodyEvents.length > 0 && (
          <div aria-hidden="true" style={styles.centerSpacer} />
        )}
        {melodyEvents.map((evt, idx) => {
          const isActive = activeMelodyEventId === evt.id || playbackMelodyEventId === evt.id;
          const isRecent = recentEventIds.has(evt.id);
          return (
            <MelodyTimelineItem
              key={evt.id}
              event={evt}
              index={idx}
              isActive={isActive}
              isRecent={isRecent}
              onClick={onClickEvent}
              registerElement={registerEventElement}
            />
          );
        })}
        {compact && melodyEvents.length > 0 && (
          <div aria-hidden="true" style={styles.centerSpacer} />
        )}
      </div>
    </div>
  );
}

type MelodyTimelineItemProps = {
  event: MelodyEvent;
  index: number;
  isActive: boolean;
  isRecent: boolean;
  onClick: (event: MelodyEvent) => void;
  registerElement: (id: string, element: HTMLButtonElement | null) => void;
};

const MelodyTimelineItem = memo(function MelodyTimelineItem({
  event,
  index,
  isActive,
  isRecent,
  onClick,
  registerElement,
}: MelodyTimelineItemProps) {
  return (
    <button
      ref={(element) => registerElement(event.id, element)}
      onClick={() => onClick(event)}
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
        <span style={styles.timelineSegment}>SEG {index + 1}</span>
      </div>
      <div style={{ ...styles.timelinePitch, color: isActive ? "#db2777" : COLORS.recentText }}>
        {event.pitch}
      </div>
    </button>
  );
});

export default memo(MelodyTimeline);
