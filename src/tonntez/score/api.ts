import { apiUrl } from "../config/api";

export type Job = {
  id: string;
  filename: string;
  status:
    "queued" | "running" | "cancelling" | "cancelled" | "failed" | "complete";
  percent: number;
  stage: string;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  error: string | null;
  queue_position: number;
  expires_at: number | null;
};
export const activeJob = (job: Job | null) =>
  !!job && ["queued", "running", "cancelling"].includes(job.status);
export const fileUrl = (id: string, kind: string) =>
  apiUrl(`/api/jobs/${id}/files/${kind}`);
export async function jsonRequest<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiUrl(url), init);
  const data = await response.json().catch(() => {
    throw new Error("無法連接辨識服務，請確認本機後端已啟動。");
  });
  if (!response.ok)
    throw Object.assign(
      new Error(
        typeof data.detail === "string"
          ? data.detail
          : "請求失敗，請稍後再試。",
      ),
      { status: response.status },
    );
  return data;
}
