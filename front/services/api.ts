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

function normalizeUrl(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";

  // 이미 http/https면 그대로
  if (/^https?:\/\//i.test(raw)) return raw;

  // 스킴이 없으면 https:// 붙이기
  return `https://${raw}`;
}

function isValidHttpUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;

    const host = u.hostname; // punycode로 변환된 hostname일 수도 있음
    // localhost 허용 여부는 취향 (원하면 true)
    if (host === "localhost") return true;

    // 1) 점(.)이 하나 이상 있어야 함 (ex: naver.com)
    if (!host.includes(".")) return false;

    // 2) 공백/언더스코어 같은 이상한 문자 방지
    if (/_|\s/.test(host)) return false;

    // 3) TLD(마지막) 최소 2글자 (ex: .com, .kr)
    const tld = host.split(".").pop() || "";
    if (tld.length < 2) return false;

    return true;
  } catch {
    return false;
  }
}


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
  const normalized = normalizeUrl(originalUrl);

  if (!normalized) {
    throw new Error("URL is required");
  }

  if (!isValidHttpUrl(normalized)) {
  throw new Error("Invalid URL format");
}

  return request<ShortenResponse>("/shorten", {
    method: "POST",
    body: JSON.stringify({ url: normalized, title }),
  });
}


/** Get statistics for a short URL */
export async function getStats(shortId: string): Promise<StatsResponse> {
  return request<StatsResponse>(`/stats/${shortId}`);
}

/** Get trend data for a given period */
// export async function getTrends(period: TrendPeriod): Promise<TrendsResponse> {
//   return request<TrendsResponse>(`/trends/latest?period=${period}`);
// }

export async function getTrends(
  period: TrendPeriod,
  view: "user" | "admin"
) {
  const url = `${API_BASE}/trends/latest?period=${period}&view=${view}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load trends (${res.status}): ${text}`);
  }

  return (await res.json()) as TrendsResponse;
}
