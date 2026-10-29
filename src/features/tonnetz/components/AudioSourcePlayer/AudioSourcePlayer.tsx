import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { styles } from "./styles";

type Props = {
  sourceUrl: string | null;
  onElementReady: (element: HTMLAudioElement | null) => void;
  onPlay: (element: HTMLAudioElement) => void;
  onPause: (element: HTMLAudioElement) => void;
  onSeeked: (element: HTMLAudioElement) => void;
  onEnded: (element: HTMLAudioElement) => void;
};

function formatTime(sec: number): string {
  const safeSec = Number.isFinite(sec) && sec > 0 ? sec : 0;
  const minutes = Math.floor(safeSec / 60);
  const seconds = Math.floor(safeSec % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function AudioSourcePlayer({
  sourceUrl,
  onElementReady,
  onPlay,
  onPause,
  onSeeked,
  onEnded,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    onElementReady(audioRef.current);
    return () => onElementReady(null);
  }, [onElementReady, sourceUrl]);

  useEffect(() => {
    if (!audioRef.current || !sourceUrl) return;
    audioRef.current.load();
    onElementReady(audioRef.current);
  }, [onElementReady, sourceUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEmptied = () => {
      setCurrentTime(0);
      setDuration(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("emptied", handleEmptied);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("emptied", handleEmptied);
    };
  }, [sourceUrl]);

  if (!sourceUrl) {
    return <div style={styles.empty}>請先上傳音檔才能使用音訊播放模式</div>;
  }

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  return (
    <div style={styles.wrap}>
      <audio
        ref={audioRef}
        src={sourceUrl}
        onPlay={(event) => onPlay(event.currentTarget)}
        onPause={(event) => onPause(event.currentTarget)}
        onSeeked={(event) => onSeeked(event.currentTarget)}
        onEnded={(event) => onEnded(event.currentTarget)}
        style={{ display: "none" }}
      />
      <div style={styles.row}>
        <span style={styles.time}>{formatTime(currentTime)}</span>
        <div style={styles.track} onClick={handleSeek}>
          <div style={{ ...styles.fill, width: `${progress * 100}%` }} />
        </div>
        <span style={styles.time}>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
