import { ApiError } from "./ApiError";

type RequestOptions = Omit<RequestInit, "method" | "body">;

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options: RequestOptions = {},
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  upload<T>(
    path: string,
    body: FormData,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  async getArrayBuffer(
    path: string,
    options: RequestOptions = {},
  ): Promise<ArrayBuffer> {
    const response = await this.send(path, { ...options, method: "GET" });
    return response.arrayBuffer();
  }

  async getText(
    path: string,
    options: RequestOptions = {},
  ): Promise<string> {
    const response = await this.send(path, { ...options, method: "GET" });
    return response.text();
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.send(path, init);
    if (response.status === 204) return undefined as T;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("json")) return response.json() as Promise<T>;
    return response.text() as Promise<T>;
  }

  private async send(path: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(this.url(path), init);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
      throw new ApiError("無法連接服務，請稍後再試。", 0, cause);
    }

    if (!response.ok) {
      const details = await this.readFailure(response);
      throw new ApiError(this.failureMessage(details), response.status, details);
    }
    return response;
  }

  private url(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  private async readFailure(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    try {
      return contentType.includes("json")
        ? await response.json()
        : await response.text();
    } catch {
      return null;
    }
  }

  private failureMessage(details: unknown): string {
    if (typeof details === "string" && details.trim()) return details;
    if (details && typeof details === "object") {
      for (const key of ["detail", "msg", "error"] as const) {
        const value = (details as Record<string, unknown>)[key];
        if (typeof value === "string" && value.trim()) return value;
      }
    }
    return "請求失敗，請稍後再試。";
  }
}
