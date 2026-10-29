import type { ApiClient } from "../../shared/api/ApiClient";

export type QuizRecord = { topicId: string; attempts: number; passed: boolean };
export type Dashboard = {
  viewedChapters: string[];
  likedChapters: string[];
  visitedAbout: boolean;
  usedTonnetz: boolean;
  usedAudioIdentify: boolean;
  usedScoreIdentify: boolean;
  quizRecords: QuizRecord[];
};

export class ProgressApi {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  recordAbout(username: string): Promise<string> {
    return this.client.post<string, { username: string }>(
      "/api/user/progress/about",
      { username },
    );
  }

  recordAudioIdentify(username: string): Promise<string> {
    return this.client.post<string, { username: string }>(
      "/api/user/progress/audio-identify",
      { username },
    );
  }

  recordScoreIdentify(username: string): Promise<string> {
    return this.client.post<string, { username: string }>(
      "/api/user/progress/score-identify",
      { username },
    );
  }

  recordQuiz(username: string, topicId: string, passed: boolean): Promise<QuizRecord[]> {
    return this.client.post<QuizRecord[], { username: string; topicId: string; passed: boolean }>(
      "/api/user/progress/quiz",
      { username, topicId, passed },
    );
  }

  dashboard(username: string): Promise<Dashboard> {
    return this.client.get<Dashboard>(
      `/api/user/dashboard/${encodeURIComponent(username)}`,
    );
  }
}
