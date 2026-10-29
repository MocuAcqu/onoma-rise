import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./ApiClient";
import { ApiError } from "./ApiError";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiClient", () => {
  it("combines the base URL and parses JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);

    const client = new ApiClient("https://api.example.com");
    await expect(client.get<{ ok: boolean }>("/health")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("serializes JSON request bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ saved: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    vi.stubGlobal("fetch", fetchMock);

    const client = new ApiClient("https://api.example.com");
    await client.post("/items", { name: "C major" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "C major" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("normalizes backend error payloads", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ detail: "檔案格式錯誤" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )));

    const client = new ApiClient("https://api.example.com");
    const error = await client.get("/failure").catch((cause) => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: "ApiError",
      message: "檔案格式錯誤",
      status: 400,
    });
  });

  it("converts connection failures to ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const client = new ApiClient("https://api.example.com");
    const error = await client.get("/health").catch((cause) => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: "ApiError",
      message: "無法連接服務，請稍後再試。",
      status: 0,
    });
  });
});
