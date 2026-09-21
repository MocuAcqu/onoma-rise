import PitchUtils from "../../core/PitchUtils";
import type { SelectionInfo, MelodyEvent } from "../../type";
import { styles as S } from "./styles";

type Props = {
  currentMelodyEvent: MelodyEvent | null;
  prevMelodyEvent:    MelodyEvent | null;
  nextMelodyEvent:    MelodyEvent | null;
  displayMelodyIndex: number;
  melodyEventsLength: number;
  selectionInfo:      SelectionInfo;
};
// ── MelodyWindow ─────────────────────────────
export default function MelodyWindow({ currentMelodyEvent, prevMelodyEvent, nextMelodyEvent, displayMelodyIndex, melodyEventsLength, selectionInfo }:Props) {
  if (currentMelodyEvent) return (
    <div style={S.melodyWindow}>
      <div style={S.melodyWindowLabel}>Melody Window</div>
      <div style={S.melodyWindowStep}>Step {displayMelodyIndex + 1} / {melodyEventsLength}</div>
      <div style={S.melodyCard}>
        <div style={{ ...S.melodyNeighbor, opacity: prevMelodyEvent ? 1 : 0.3 }}>{prevMelodyEvent?.pitch ?? "·"}</div>
        <div style={S.divider} />
        <div style={S.melodyCurrent}>{currentMelodyEvent.pitch}</div>
        <div style={S.divider} />
        <div style={{ ...S.melodyNeighbor, opacity: nextMelodyEvent ? 1 : 0.3 }}>{nextMelodyEvent?.pitch ?? "·"}</div>
      </div>
      <div style={S.melodyInfoBox}>
        <span style={S.metaLabel}>Time</span>
        <span style={S.metaValue}>{PitchUtils.formatTime(currentMelodyEvent.start)} – {PitchUtils.formatTime(currentMelodyEvent.end)}</span>
        <span style={S.metaLabel}>Pitch</span>
        <span style={S.metaValue}>{selectionInfo?.kind === "note" ? selectionInfo.note : PitchUtils.getMelodyNote(currentMelodyEvent, 4)}</span>
      </div>
    </div>
  );

  if (selectionInfo?.kind === "note") return (
    <div style={S.melodyWindow}>
      <div style={S.melodyWindowLabel}>Selection</div>
      <div style={S.chordCard}>
        <div style={S.chordLabel}>NOTE</div>
        <div style={S.chordName}>{selectionInfo.label}</div>
        <div style={S.chordNotes}>Pitch: <strong>{selectionInfo.note}</strong></div>
      </div>
    </div>
  );

  if (selectionInfo?.kind === "chord") return (
    <div style={S.melodyWindow}>
      <div style={{
        ...S.chordCard,
        background: selectionInfo.chordType === "major" ? "rgba(232,148,255,0.14)" : "rgba(148,185,255,0.16)",
        borderColor: selectionInfo.chordType === "major" ? "rgba(232,148,255,0.46)" : "rgba(148,185,255,0.48)",
      }}>
        <div style={S.chordLabel}>CHORD</div>
        <div style={S.chordName}>{selectionInfo.chordName}</div>
        <div style={S.chordNotes}>Notes: <strong>{selectionInfo.notes.join(" – ")}</strong></div>
      </div>
    </div>
  );

  return (
    <div style={S.melodyWindow}>
      <div style={S.emptyText}>Click a timeline segment to view prev / current / next note.</div>
    </div>
  );
}
