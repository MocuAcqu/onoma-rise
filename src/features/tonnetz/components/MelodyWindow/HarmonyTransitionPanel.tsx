import type {
  HarmonyTransition,
  PitchClassMotion,
} from "../../score/harmonicAnalysis";
import { spellPitchClass } from "../../score/pitchSpelling";
import type { PitchClass } from "../../types";
import { styles as S } from "./styles";

type Props = {
  transition: HarmonyTransition;
  preferFlats: boolean;
};

function motionLabel(motion: PitchClassMotion) {
  if (motion.direction === "same") return "不變";
  return `${motion.direction === "ascending" ? "上行" : "下行"} ${motion.semitones} 個半音`;
}

function inversionLabel(inversion: number) {
  return ["根位", "第一轉位", "第二轉位", "第三轉位"][inversion]
    ?? `第 ${inversion} 轉位`;
}

function pitchList(pitches: readonly PitchClass[], preferFlats: boolean) {
  return pitches.length
    ? pitches.map((pitch) => spellPitchClass(pitch, preferFlats)).join(" · ")
    : "無";
}

function changeLabel(transition: HarmonyTransition, preferFlats: boolean) {
  const { removedPitchClasses, addedPitchClasses } = transition;
  if (removedPitchClasses.length === 1 && addedPitchClasses.length === 1) {
    return `僅 ${spellPitchClass(removedPitchClasses[0], preferFlats)} → ${spellPitchClass(addedPitchClasses[0], preferFlats)}`;
  }
  if (!removedPitchClasses.length && !addedPitchClasses.length) return "組成音不變";
  return `移除 ${pitchList(removedPitchClasses, preferFlats)}；加入 ${pitchList(addedPitchClasses, preferFlats)}`;
}

/** Compact, disclosure-based comparison for the current and previous chord. */
export default function HarmonyTransitionPanel({ transition, preferFlats }: Props) {
  const previousRoot = spellPitchClass(transition.previousRoot, preferFlats);
  const currentRoot = spellPitchClass(transition.currentRoot, preferFlats);
  const previousBass = spellPitchClass(transition.previousBass, preferFlats);
  const currentBass = spellPitchClass(transition.currentBass, preferFlats);
  return (
    <section style={S.transitionPanel} aria-label="前後和弦關係">
      <div style={S.transitionHeading}>
        {transition.previousChord} <span aria-hidden="true">→</span> {transition.currentChord}
      </div>
      <div style={S.transitionSummary}>
        <span style={S.transitionLabel}>根音</span>
        <span>
          {previousRoot} → {currentRoot}
          <small style={S.transitionMotion}>（{motionLabel(transition.rootMotion)}）</small>
        </span>
        <span style={S.transitionLabel}>低音</span>
        <span>
          {previousBass} → {currentBass}
          <small style={S.transitionMotion}>（{motionLabel(transition.bassMotion)}）</small>
        </span>
        <span style={S.transitionLabel}>共同音</span>
        <span>{pitchList(transition.commonPitchClasses, preferFlats)}</span>
        <span style={S.transitionLabel}>變化</span>
        <span>{changeLabel(transition, preferFlats)}</span>
        <span style={S.transitionLabel}>轉位</span>
        <span>
          {inversionLabel(transition.previousInversion)} → {inversionLabel(transition.currentInversion)}
        </span>
      </div>

      <details style={S.transitionDetails}>
        <summary style={S.transitionDetailsSummary}>詳細資訊</summary>
        <div style={S.transitionDetailsBody}>
          <span>前：{pitchList(transition.previousPitchClasses, preferFlats)}</span>
          <span>後：{pitchList(transition.currentPitchClasses, preferFlats)}</span>
          <span>移除：{pitchList(transition.removedPitchClasses, preferFlats)}</span>
          <span>加入：{pitchList(transition.addedPitchClasses, preferFlats)}</span>
          <span>
            級數：{transition.previousRomanNumeral} → {transition.currentRomanNumeral}
          </span>
        </div>
      </details>
    </section>
  );
}
