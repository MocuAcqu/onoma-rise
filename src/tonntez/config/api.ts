const configuredApiBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

/**
 * Empty in local development and same-origin deployments. Set
 * VITE_API_BASE_URL only when the frontend and API use different origins.
 */
export const API_BASE_URL = configuredApiBase.replace(/\/$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
