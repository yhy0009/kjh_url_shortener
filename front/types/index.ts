/** Response from POST /shorten */
export interface ShortenResponse {
  shortId: string;
  shortUrl: string;
}

/** Response from GET /stats/{shortId} */
export interface StatsResponse {
  shortId: string;
  originalUrl: string;
  title: string;
  totalClicks: number;
  stats: {
    clicksByHour: Record<string, number>;
    clicksByDay: Record<string, number>;
    clicksByReferer: Record<string, number>;
    peakHour: number | string;   // 백엔드에서 "16"처럼 string일 수도 있어 안전하게
    topReferer: string | null;
  };
}

/** A single top URL entry from the trends API */
export interface TopUrlEntry {
  shortId: string;
  clicks: number;
  originalUrl?: string; // 백엔드에서 안 내려주므로 optional
}

/** A single top domain entry from the trends API */
export interface TopDomainEntry {
  domain: string;
  count: number; // clicks -> count로 변경
}

/** Optional category distribution (if enabled in backend) */
export interface CategoryCountEntry {
  category: string;
  count: number;
}

/** Insights can be old(string) or new(object) */
export type TrendInsights =
  | string
  | {
      admin?: string[];
      user?: string[];
    };

/** Response from GET /trends?period=... */
export interface TrendsResponse {
  period: string;
  view?: "admin" | "user"; // trends_latest에서 내려주면 받기
  trend: {
    generatedAt?: string;
    model?: string;
    stats: {
      totalClicks: number;
      totalUrls?: number;
      topUrls: TopUrlEntry[];
      topDomains: TopDomainEntry[];
      categoryCounts?: CategoryCountEntry[]; // 용자용 페이지에서 쓰기 좋음
      clicksByHour?: Record<string, number>;
      clicksByDay?: Record<string, number>;
      clicksByReferer?: Record<string, number>;
      peakHour?: string | number | null;
      topReferer?: string | null;
    };
    insights?: TrendInsights; // string -> 유니온으로 변경, optional 처리
  };
}

/** Available trend periods */
export type TrendPeriod = "1h" | "24h" | "7d";
