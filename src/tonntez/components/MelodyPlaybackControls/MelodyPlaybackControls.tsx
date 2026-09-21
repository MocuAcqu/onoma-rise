import type { MelodyEvent } from "../../type";
import { styles } from "./styles";

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
  const handlePrimaryAction = () => {
    if (!isPlaying) onPlay();
    else if (isPaused) onResume();
    else onPause();
  };

  const label = !isPlaying ? "▶ 播放" : isPaused ? "▶ 繼續" : "⏸ 暫停";

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

      <div style={styles.sequence}>
        {events.map((event, index) => (
          <span key={event.id}>
            <span style={event.id === activeEventId ? styles.sequenceCurrent : undefined}>
              {event.pitch}
            </span>
            {index < events.length - 1 && " → "}
          </span>
        ))}
      </div>
    </div>
  );
}
