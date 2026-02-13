import type {
  ShortenResponse,
  StatsResponse,
  TrendsResponse,
  TrendPeriod,
} from "@/types";

/**
 * Base URL for the backend API.
 * Configure via NEXT_PUBLIC_API_URL environment variable.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(errorBody || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Shorten a URL */
export async function shortenUrl(originalUrl: string, title?: string): Promise<ShortenResponse> {
  return request<ShortenResponse>("/shorten", {
    method: "POST",
    body: JSON.stringify({ url: originalUrl, title }),
  });
}


/** Get statistics for a short URL */
export async function getStats(shortId: string): Promise<StatsResponse> {
  return request<StatsResponse>(`/stats/${shortId}`);
}

/** Get trend data for a given period */
export async function getTrends(period: TrendPeriod): Promise<TrendsResponse> {
  return request<TrendsResponse>(`/trends?period=${period}`);
}
