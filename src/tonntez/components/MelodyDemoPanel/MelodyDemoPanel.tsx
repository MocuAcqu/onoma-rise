import AudioSourcePlayer from "../AudioSourcePlayer";
import MelodyPlaybackControls from "../MelodyPlaybackControls";
import PlaybackModeSelector from "../PlaybackModeSelector";
import type { PlaybackMode } from "../../store/playbackStore";
import type { MelodyEvent } from "../../type";
import { styles } from "./styles";

type Props = {
  melodyEvents: MelodyEvent[];
  isPlayingMelody: boolean;
  isPaused: boolean;
  playbackMode: PlaybackMode;
  audioObjectUrl: string | null;
  activeEventId: string | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onModeChange: (mode: PlaybackMode) => void;
  onAudioElementReady: (element: HTMLAudioElement | null) => void;
  onAudioPlay: (element: HTMLAudioElement) => void;
  onAudioPause: (element: HTMLAudioElement) => void;
  onAudioSeeked: (element: HTMLAudioElement) => void;
  onAudioEnded: (element: HTMLAudioElement) => void;
};

export default function MelodyDemoPanel({
  melodyEvents,
  isPlayingMelody,
  isPaused,
  playbackMode,
  audioObjectUrl,
  activeEventId,
  onPlay,
  onPause,
  onResume,
  onStop,
  onModeChange,
  onAudioElementReady,
  onAudioPlay,
  onAudioPause,
  onAudioSeeked,
  onAudioEnded,
}: Props) {
  const hasAudio = Boolean(audioObjectUrl);
  const isDisabled = melodyEvents.length === 0 ||
    (!hasAudio && playbackMode === "audio");

  return (
    <section style={styles.panel}>
      <header style={styles.header}>
        <div style={styles.title}>Melody Demo</div>
        <PlaybackModeSelector mode={playbackMode} onChange={onModeChange} />
      </header>

      {playbackMode === "audio" && (
        <div style={styles.audioSection}>
          <AudioSourcePlayer
            sourceUrl={audioObjectUrl}
            onElementReady={onAudioElementReady}
            onPlay={onAudioPlay}
            onPause={onAudioPause}
            onSeeked={onAudioSeeked}
            onEnded={onAudioEnded}
          />
        </div>
      )}

      <MelodyPlaybackControls
        events={melodyEvents}
        isPlaying={isPlayingMelody}
        isPaused={isPaused}
        disabled={isDisabled}
        activeEventId={activeEventId}
        onPlay={onPlay}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
      />

      <div style={styles.modeDescription}>
        <span style={styles.modeLabel}>
          {playbackMode === "audio" ? "音訊模式" : "合成模式"}
        </span>
        {playbackMode === "audio" && (
          <span style={styles.modeText}>播放原始音檔，Tonnetz 依時間軸同步高亮</span>
        )}
      </div>

      {isPaused && (
        <div style={styles.pausedMessage}>⏸ 已暫停 — 按「▶ 繼續」繼續播放</div>
      )}
    </section>
  );
}
