function apiBase(
  configured: string | undefined,
  variable: string,
): string {
  const value = configured?.trim();
  if (value) return value.replace(/\/$/, "");
  if (import.meta.env.DEV) return "";
  throw new Error(`缺少部署環境變數：${variable}`);
}

export const apiConfig = {
  baseUrl: apiBase(
    import.meta.env.VITE_API_BASE_URL,
    "VITE_API_BASE_URL",
  ),
} as const;
