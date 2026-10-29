import type { ApiClient } from "../../../shared/api/ApiClient";

export type ChapterStats = {
  chapterId: string;
  views: number;
  likes: number;
  likedBy: string[];
};
export type LikeResult = { likes: number; hasLiked: boolean };

export class ChapterApi {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getStats(chapterId: string): Promise<ChapterStats> {
    return this.client.get<ChapterStats>(`/api/chapters/${encodeURIComponent(chapterId)}`);
  }

  addView(chapterId: string, username: string | null): Promise<ChapterStats> {
    return this.client.post<ChapterStats, { username: string | null }>(
      `/api/chapters/${encodeURIComponent(chapterId)}/view`,
      { username },
    );
  }

  toggleLike(chapterId: string, username: string): Promise<LikeResult> {
    return this.client.post<LikeResult, { username: string }>(
      `/api/chapters/${encodeURIComponent(chapterId)}/like`,
      { username },
    );
  }
}
