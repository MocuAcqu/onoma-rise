import type { ApiClient } from "../../../shared/api/ApiClient";
import type {
  ChordEvent,
  KeyEstimate,
  MelodyEvent,
  TranscriptionAnalysis,
} from "../types";

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

type TranscribeResponse =
  | RawMelodyEvent[]
  | {
      events: RawMelodyEvent[];
      chords?: ChordEvent[];
      estimatedKey?: KeyEstimate;
    };

export class AudioRecognitionApi {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async transcribe(file: File, signal?: AbortSignal): Promise<TranscriptionAnalysis> {
    const body = new FormData();
    body.append("file", file);
    const data = await this.client.upload<TranscribeResponse>(
      "/api/audio/transcribe",
      body,
      { signal },
    );

    if (Array.isArray(data)) {
      return { events: this.normalize(data), chords: [], estimatedKey: null };
    }
    return {
      events: this.normalize(data.events ?? []),
      chords: data.chords ?? [],
      estimatedKey: data.estimatedKey ?? null,
    };
  }

  private normalize(events: RawMelodyEvent[]): MelodyEvent[] {
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
}
