import type { ChordEvent, KeyEstimate, MelodyEvent, TranscriptionAnalysis } from "../type";
import { apiUrl } from "../config/api";

type TranscribeResponse =
  | RawMelodyEvent[]
  | { events: RawMelodyEvent[]; chords?: ChordEvent[]; estimatedKey?: KeyEstimate };

type RawMelodyEvent = {
  id?: string;
  pitch: string;
  note?: string;
  midi?: number;
  start: number;
  end: number;
  confidence?: number;
  frequencyHz?: number;
  detectedFrequencyHz?: number;
};

function normalizeEvents(events: RawMelodyEvent[]): MelodyEvent[] {
  return events
    .map((event, index) => ({
      id: event.id ?? `evt-${index}`,
      pitch: event.pitch,
      start: event.start,
      end: event.end,
      midi: event.midi,
      note: event.note,
      confidence: event.confidence,
      frequencyHz: event.frequencyHz,
      detectedFrequencyHz: event.detectedFrequencyHz,
    }))
    .sort((a, b) => a.start - b.start);
}

export async function transcribeAudio(file: File): Promise<TranscriptionAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(apiUrl("/api/audio/transcribe"), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const failure = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(failure?.error ?? `Transcription failed: ${res.status}`);
  }

  const data: TranscribeResponse = await res.json();

  if (Array.isArray(data)) {
    return { events: normalizeEvents(data), chords: [], estimatedKey: null };
  }
  return {
    events: normalizeEvents(data.events ?? []),
    chords: data.chords ?? [],
    estimatedKey: data.estimatedKey ?? null,
  };
}
