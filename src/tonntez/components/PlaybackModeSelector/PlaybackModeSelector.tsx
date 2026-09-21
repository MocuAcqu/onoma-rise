import type { PlaybackMode } from "../../store/playbackStore";
import { styles } from "./styles";

const MODES: PlaybackMode[] = ["audio", "synth"];

type Props = {
  mode: PlaybackMode;
  onChange: (mode: PlaybackMode) => void;
};

export default function PlaybackModeSelector({ mode, onChange }: Props) {
  return (
    <div style={styles.container}>
      {MODES.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          style={{
            ...styles.button,
            ...(mode === option ? styles.activeButton : {}),
          }}
        >
          {option === "audio" ? "音檔" : "合成"}
        </button>
      ))}
    </div>
  );
}
