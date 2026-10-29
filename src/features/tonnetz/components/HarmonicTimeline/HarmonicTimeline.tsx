import { memo, useCallback, useEffect, useRef } from "react";
import type { HarmonicTimelineEvent } from "../../score/harmonicAnalysis";
import { styles } from "./styles";

type Props = {
  events: HarmonicTimelineEvent[];
  activeEventId: string | null;
  onClickEvent: (event: HarmonicTimelineEvent) => void;
};

function HarmonicTimeline({ events, activeEventId, onClickEvent }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef(new Map<string, HTMLButtonElement>());
  const registerEventElement = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (element) eventRefs.current.set(id, element);
    else eventRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (!activeEventId) return;
    const list = listRef.current;
    const item = eventRefs.current.get(activeEventId);
    if (!list || !item) return;
    // offsetTop can be relative to the outer card and used to pin the active
    // item near the top. Viewport rectangles give the exact delta required to
    // keep the sounding harmony in the middle of this scroll container.
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const centerDelta = itemRect.top + itemRect.height / 2
      - (listRect.top + listRect.height / 2);
    list.scrollTo({ top: Math.max(0, list.scrollTop + centerDelta), behavior: "auto" });
  }, [activeEventId]);

  return (
    <div style={styles.timelinePanel}>
      <div ref={listRef} style={styles.timelineList}>
        {events.length > 0 && <div aria-hidden="true" style={styles.centerSpacer} />}
        {events.length === 0 && (
          <div style={styles.emptyText}>目前沒有足夠音符建立和弦片段。</div>
        )}
        {events.map((event) => {
          const active = event.id === activeEventId;
          return (
            <HarmonicTimelineItem
              key={event.id}
              event={event}
              isActive={active}
              onClick={onClickEvent}
              registerElement={registerEventElement}
            />
          );
        })}
        {events.length > 0 && <div aria-hidden="true" style={styles.centerSpacer} />}
      </div>
    </div>
  );
}

type HarmonicTimelineItemProps = {
  event: HarmonicTimelineEvent;
  isActive: boolean;
  onClick: (event: HarmonicTimelineEvent) => void;
  registerElement: (id: string, element: HTMLButtonElement | null) => void;
};

const HarmonicTimelineItem = memo(function HarmonicTimelineItem({
  event,
  isActive,
  onClick,
  registerElement,
}: HarmonicTimelineItemProps) {
  return (
    <button
      ref={(element) => registerElement(event.id, element)}
      type="button"
      onClick={() => onClick(event)}
      style={{
        ...styles.timelineItem,
        borderColor: isActive ? "#a855f7" : "rgba(124,58,237,0.12)",
        background: isActive
          ? "linear-gradient(90deg, rgba(236,72,153,0.14), rgba(124,58,237,0.14))"
          : "#ffffff",
        boxShadow: isActive ? "0 8px 18px rgba(124,58,237,0.16)" : "none",
      }}
    >
      <div style={styles.timelineTop}>
        <span style={styles.roman}>{event.harmony.romanNumeral}</span>
      </div>
      <div style={styles.chordRow}>
        <strong style={styles.chordName}>{event.harmony.chordName}</strong>
        <span style={styles.notes}>{event.harmony.notes.join(" – ")}</span>
      </div>
    </button>
  );
});

export default memo(HarmonicTimeline);
