import type { ApiClient } from "../../../shared/api/ApiClient";
import type { ArticulationEvent } from "../score/articulationTiming";
import type { NotationMark } from "../score/fermataTiming";
import type { OrnamentEvent } from "../score/ornamentTiming";
import type { PerformanceEvent } from "../score/performanceTiming";

export type ScoreJob = {
  id: string;
  filename: string;
  status:
    | "queued"
    | "running"
    | "cancelling"
    | "cancelled"
    | "failed"
    | "complete";
  percent: number;
  stage: string;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  error: string | null;
  queue_position: number;
  expires_at: number | null;
};

export type ScoreNotation = {
  articulations: ArticulationEvent[];
  marks: NotationMark[];
  ornaments: OrnamentEvent[];
  performance: PerformanceEvent[];
};

export type ScoreFiles = { midi: ArrayBuffer; musicXml: string };

export class ScoreRecognitionApi {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  createJob(file: File, signal?: AbortSignal): Promise<ScoreJob> {
    const body = new FormData();
    body.append("file", file);
    return this.client.upload<ScoreJob>("/api/jobs", body, { signal });
  }

  getJob(jobId: string, signal?: AbortSignal): Promise<ScoreJob> {
    return this.client.get<ScoreJob>(`/api/jobs/${jobId}`, { signal });
  }

  cancelJob(jobId: string): Promise<ScoreJob> {
    return this.client.post<ScoreJob>(`/api/jobs/${jobId}/cancel`);
  }

  getNotation(jobId: string, signal?: AbortSignal): Promise<ScoreNotation> {
    return this.client.get<ScoreNotation>(`/api/jobs/${jobId}/notation`, { signal });
  }

  async getFiles(jobId: string, signal?: AbortSignal): Promise<ScoreFiles> {
    const [midi, musicXml] = await Promise.all([
      this.client.getArrayBuffer(`/api/jobs/${jobId}/files/midi`, { signal }),
      this.client.getText(`/api/jobs/${jobId}/files/musicxml`, { signal }),
    ]);
    return { midi, musicXml };
  }

  isActive(job: ScoreJob | null): boolean {
    return !!job && ["queued", "running", "cancelling"].includes(job.status);
  }
}
