import { styles } from "./styles";

type Props = {
  isTranscribing: boolean;
  onSelectFile: (file: File) => void | Promise<void>;
};

export default function AudioUploadPanel({
  isTranscribing,
  onSelectFile,
}: Props) {
  return (
    <div style={styles.uploadWrap}>
      <label
        style={{
          ...styles.uploadLabel,
          ...(isTranscribing ? styles.uploadLabelDisabled : {}),
        }}
      >
        <span style={styles.uploadPrompt}>
          {isTranscribing ? "正在辨識音檔" : "匯入音檔"}
        </span>
        <span style={styles.uploadButton}>
          {isTranscribing ? "辨識中…" : "選擇檔案"}
        </span>
        <input
          type="file"
          accept="audio/*,.wav,.mp3,.m4a"
          disabled={isTranscribing}
          style={styles.uploadInputHidden}
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            await onSelectFile(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
    </div>
  );
}
