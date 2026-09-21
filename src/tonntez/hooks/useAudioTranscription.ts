import { useCallback, useEffect, useState } from "react";
import { transcribeAudio } from "../services/transcriptionApi";
import type { ChordEvent, KeyEstimate, MelodyEvent } from "../type";

type Options = {
  initialEvents: MelodyEvent[];
  onTranscribed?: () => void;
};

export function useAudioTranscription({
  initialEvents,
  onTranscribed,
}: Options) {
  const [melodyEvents, setMelodyEvents] = useState(initialEvents);
  const [chordEvents, setChordEvents] = useState<ChordEvent[]>([]);
  const [estimatedKey, setEstimatedKey] = useState<KeyEstimate | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audioFile) return;

    const objectUrl = URL.createObjectURL(audioFile);
    setAudioObjectUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [audioFile]);

  const selectAudioFile = useCallback(
    async (file: File) => {
      try {
        setIsTranscribing(true);
        setError(null);
        setAudioFile(file);

        const analysis = await transcribeAudio(file);
        setMelodyEvents(analysis.events);
        setChordEvents(analysis.chords);
        setEstimatedKey(analysis.estimatedKey);
        onTranscribed?.();
      } catch (cause) {
        console.error(cause);
        const detail = cause instanceof Error ? cause.message : "未知錯誤";
        setError(`辨識失敗：${detail}。請確認後端已啟動且音檔格式正確。`);
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscribed],
  );

  return {
    melodyEvents,
    chordEvents,
    estimatedKey,
    audioObjectUrl,
    isTranscribing,
    error,
    selectAudioFile,
  };
}
