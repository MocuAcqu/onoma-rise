import AudioUploadPanel from "../components/AudioUploadPanel";
import TransformToolbar from "../components/TransformToolbar";
import type { TransformMode } from "../graph/useTransformTransition";
import { styles as S } from "./styles";

type RecognitionToolbarProps = {
  isScoreMode: boolean;
  displayMode: TransformMode;
  isTranscribing: boolean;
  onActivateAudioMode: () => void;
  onActivateScoreMode: () => void;
  onTransformModeChange: (mode: TransformMode) => void;
  onSelectAudioFile: (file: File) => void | Promise<void>;
};

export function RecognitionToolbar({
  isScoreMode,
  displayMode,
  isTranscribing,
  onActivateAudioMode,
  onActivateScoreMode,
  onTransformModeChange,
  onSelectAudioFile,
}: RecognitionToolbarProps) {
  return (
    <div style={S.toolbar}>
      <h2 style={S.toolbarTitle}>音樂辨識</h2>

      <div style={S.toolbarRight}>
        <div style={S.modeSwitch} role="group" aria-label="辨識模式">
          <button
            type="button"
            style={{ ...S.modeButton, ...(!isScoreMode ? S.modeButtonActive : {}) }}
            aria-pressed={!isScoreMode}
            onClick={onActivateAudioMode}
          >
            音訊辨識
          </button>
          <button
            type="button"
            style={{ ...S.modeButton, ...(isScoreMode ? S.modeButtonActive : {}) }}
            aria-pressed={isScoreMode}
            onClick={onActivateScoreMode}
          >
            樂譜辨識
          </button>
        </div>

        <TransformToolbar
          activeMode={displayMode}
          onModeChange={onTransformModeChange}
        />

        {!isScoreMode && (
          <AudioUploadPanel
            isTranscribing={isTranscribing}
            onSelectFile={onSelectAudioFile}
          />
        )}
      </div>
    </div>
  );
}
