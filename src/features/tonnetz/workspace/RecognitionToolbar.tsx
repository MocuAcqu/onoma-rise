import AudioUploadPanel from "../components/AudioUploadPanel";
import TransformToolbar from "../components/TransformToolbar";
import type { TransformMode } from "../graph/useTransformTransition";
import { styles as S } from "./styles";

type RecognitionToolbarProps = {
  isScoreMode: boolean;
  displayMode: TransformMode;
  isTranscribing: boolean;
  /** 手機版：工具列改為上下排列、按鈕填滿寬度 */
  isCompact?: boolean;
  onActivateAudioMode: () => void;
  onActivateScoreMode: () => void;
  onTransformModeChange: (mode: TransformMode) => void;
  onSelectAudioFile: (file: File) => void | Promise<void>;
};

export function RecognitionToolbar({
  isScoreMode,
  displayMode,
  isTranscribing,
  isCompact = false,
  onActivateAudioMode,
  onActivateScoreMode,
  onTransformModeChange,
  onSelectAudioFile,
}: RecognitionToolbarProps) {
  return (
    <div style={isCompact ? { ...S.toolbar, ...S.toolbarCompact } : S.toolbar}>
      <h2 style={isCompact ? { ...S.toolbarTitle, ...S.toolbarTitleCompact } : S.toolbarTitle}>音樂辨識</h2>

      <div style={isCompact ? { ...S.toolbarRight, ...S.toolbarRightCompact } : S.toolbarRight}>
        <div
          style={isCompact ? { ...S.modeSwitch, ...S.modeSwitchCompact } : S.modeSwitch}
          role="group"
          aria-label="辨識模式"
        >
          <button
            type="button"
            style={{ ...S.modeButton, ...(isCompact ? S.modeButtonCompact : {}), ...(!isScoreMode ? S.modeButtonActive : {}) }}
            aria-pressed={!isScoreMode}
            onClick={onActivateAudioMode}
          >
            音訊辨識
          </button>
          <button
            type="button"
            style={{ ...S.modeButton, ...(isCompact ? S.modeButtonCompact : {}), ...(isScoreMode ? S.modeButtonActive : {}) }}
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
