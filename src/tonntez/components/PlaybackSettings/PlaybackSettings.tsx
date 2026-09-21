import { styles } from "./styles";

type Props = {
  octave: number;
  isSustain: boolean;
  onOctaveChange: (octave: number) => void;
};

export default function PlaybackSettings({
  octave,
  isSustain,
  onOctaveChange,
}: Props) {
  return (
    <div style={styles.controls}>
      <button style={styles.octaveButton} onClick={() => onOctaveChange(octave - 1)}>↓</button>
      <span style={styles.label}>Octave</span>
      <span style={styles.value}>{octave}</span>
      <button style={styles.octaveButton} onClick={() => onOctaveChange(octave + 1)}>↑</button>
      <span style={{ ...styles.label, marginLeft: 16 }}>Sustain</span>
      <span style={{ ...styles.value, color: isSustain ? "#d45bdc" : "#71809b" }}>
        {isSustain ? "ON" : "OFF"}
      </span>
    </div>
  );
}
