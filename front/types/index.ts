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
    peakHour: number;
    topReferer: string;
  };
}

/** A single top URL entry from the trends API */
export interface TopUrlEntry {
  shortId: string;
  originalUrl: string;
  clicks: number;
}

/** A single top domain entry from the trends API */
export interface TopDomainEntry {
  domain: string;
  clicks: number;
}

/** Response from GET /trends?period=... */
export interface TrendsResponse {
  period: string;
  trend: {
    stats: {
      totalClicks: number;
      topUrls: TopUrlEntry[];
      topDomains: TopDomainEntry[];
    };
    insights: string;
  };
}

/** Available trend periods */
export type TrendPeriod = "1h" | "24h" | "7d";
