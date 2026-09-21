import { useEffect, useRef, useState } from "react";
import { activeJob, fileUrl, jsonRequest, type Job } from "./api";
import { demoScore, parseMidi, validate, type Score } from "./music";

import type { NotationMark } from "./fermataTiming";
import type { ArticulationEvent } from "./articulationTiming";
import type { OrnamentEvent } from "./ornamentTiming";
import type { PerformanceEvent } from "./performanceTiming";

export function useScoreImport(onLoaded: () => void) {
  const [score, setScore] = useState<Score | null>(null);
  const [title, setTitle] = useState("");
  const [job, setJob] = useState<Job | null>(null);
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
      const body = new FormData();
      body.append("file", file);
      let current = await jsonRequest<Job>("/api/jobs", {
        method: "POST",
        body,
        signal,
      });
      setJob(current);
      while (activeJob(current)) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        if (signal.aborted) return;
        current = await jsonRequest<Job>(`/api/jobs/${current.id}`, { signal });
        setJob(current);
      }
      if (current.status === "cancelled") return;
      if (current.status !== "complete")
        throw new Error(current.error || "樂譜辨識失敗");
      const [midi, xml] = await Promise.all(
        ["midi", "musicxml"].map(async (kind) => {
          const response = await fetch(fileUrl(current.id, kind), { signal });
          if (!response.ok) throw new Error("無法取得辨識結果，請重新匯入。");
          return response;
        }),
      );
      const notation = await jsonRequest<{
        articulations: ArticulationEvent[];
        marks: NotationMark[];
        ornaments: OrnamentEvent[];
        performance: PerformanceEvent[];
      }>(
        `/api/jobs/${current.id}/notation`,
        { signal },
      );
      const result = parseMidi(
        new Uint8Array(await midi.arrayBuffer()),
        await xml.text(),
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
        await jsonRequest<Job>(`/api/jobs/${job.id}/cancel`, {
          method: "POST",
        }),
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
