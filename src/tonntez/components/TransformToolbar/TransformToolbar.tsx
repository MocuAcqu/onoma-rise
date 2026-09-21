import type { TransformMode } from "../../store/playbackStore";
import { styles } from "./styles";

const MODES: TransformMode[] = ["basic", "P", "L", "R"];

type Props = {
  activeMode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
};

export default function TransformToolbar({ activeMode, onModeChange }: Props) {
  return (
    <div style={styles.toolbar}>
      <span style={styles.label}>View</span>
      <div style={styles.group}>
        {MODES.map((mode) => (
          <button
            key={mode}
            style={{
              ...styles.button,
              ...(activeMode === mode ? styles.activeButton : {}),
            }}
            onClick={() => onModeChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
