import { useEffect, useRef, useState } from "react";
import { scoreRecognitionApi } from "../api";
import type { ScoreJob } from "../api";
import { demoScore, parseMidi, validate, type Score } from "./music";

export function useScoreImport(onLoaded: () => void) {
  const [score, setScore] = useState<Score | null>(null);
  const [title, setTitle] = useState("");
  const [job, setJob] = useState<ScoreJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function upload(file: File) {
    if (busy) return;
    const problem = validate(file);
    if (problem) {
      setError(problem);
      return;
    }
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const signal = abort.signal;
    setBusy(true);
    setError("");
    setJob(null);
    try {
      let current = await scoreRecognitionApi.createJob(file, signal);
      setJob(current);
      while (scoreRecognitionApi.isActive(current)) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        if (signal.aborted) return;
        current = await scoreRecognitionApi.getJob(current.id, signal);
        setJob(current);
      }
      if (current.status === "cancelled") return;
      if (current.status !== "complete")
        throw new Error(current.error || "樂譜辨識失敗");
      const [files, notation] = await Promise.all([
        scoreRecognitionApi.getFiles(current.id, signal),
        scoreRecognitionApi.getNotation(current.id, signal),
      ]);
      const result = parseMidi(
        new Uint8Array(files.midi),
        files.musicXml,
        notation.marks ?? [],
        notation.performance ?? [],
        notation.ornaments ?? [],
        notation.articulations ?? [],
      );
      if (signal.aborted) return;
      setScore(result);
      setTitle(file.name);
      onLoadedRef.current();
    } catch (cause) {
      if (!signal.aborted)
        setError(cause instanceof Error ? cause.message : "匯入失敗");
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }
  async function cancel() {
    if (!job) return;
    try {
      setJob(
        await scoreRecognitionApi.cancelJob(job.id),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "取消失敗");
    }
  }
  function demo() {
    if (busy) return;
    setScore(demoScore());
    setTitle("歡樂頌 · 示範樂譜");
    setError("");
    onLoadedRef.current();
  }
  return { score, title, job, busy, error, upload, cancel, demo };
}
