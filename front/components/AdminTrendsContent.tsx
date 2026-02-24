"use client";

import {
  Globe,
  Link2,
  Sparkles,
  MousePointerClick,
  Share2,
  Clock,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrendsResponse } from "@/types";

interface AdminTrendsContentProps {
  data: TrendsResponse;
}

function toLines(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);

  if (typeof v === "string") {
    return v.split("\n").map(s => s.trim()).filter(Boolean);
  }

  return [];
}

function getAdminInsights(insights: unknown): string[] {
  // new: {admin?:[], user?:[]}
  if (insights && typeof insights === "object") {
    const anyObj = insights as any;
    if (Array.isArray(anyObj.admin)) return toLines(anyObj.admin);
  }
  // old: string
  if (typeof insights === "string") return toLines(insights);
  return [];
}

function getUserInsights(insights: unknown): string[] {
  if (insights && typeof insights === "object") {
    const anyObj = insights as any;
    if (Array.isArray(anyObj.user)) return toLines(anyObj.user);
  }
  return [];
}

export function AdminTrendsContent({ data }: AdminTrendsContentProps) {
  const { stats, insights } = data.trend;

  const totalClicks = Number(stats.totalClicks || 0);
  const totalUrls = Number(stats.totalUrls || 0);

  const peakHour = stats.peakHour ?? null;
  const peakHourLabel =
    peakHour === null || peakHour === undefined
      ? "-"
      : `${String(peakHour).padStart(2, "0")}:00`;

  const topReferer = stats.topReferer ?? "-";

  const adminLines = getAdminInsights(insights);
  const userLines = getUserInsights(insights);

  const topDomains = stats.topDomains ?? [];
  const topUrls = stats.topUrls ?? [];

  const refererEntries = Object.entries(stats.clicksByReferer ?? {})
    .map(([k, v]) => ({ referer: k, count: Number(v || 0) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const hourEntries = Object.entries(stats.clicksByHour ?? {})
    .map(([k, v]) => ({ hour: k, count: Number(v || 0) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const dayEntries = Object.entries(stats.clicksByDay ?? {})
    .map(([k, v]) => ({ day: k, count: Number(v || 0) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* KPI Row */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <MousePointerClick className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Clicks
              </p>
              <p className="text-3xl font-bold text-foreground">
                {totalClicks.toLocaleString()}
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {data.period}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Link2 className="h-6 w-6 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total URLs
              </p>
              <p className="text-3xl font-bold text-foreground">
                {totalUrls.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Peak Hour
              </p>
              <p className="text-2xl font-bold text-foreground">{peakHourLabel}</p>
              <p className="text-xs text-muted-foreground">UTC</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Share2 className="h-6 w-6 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Top Referer
              </p>
              <p className="truncate text-xl font-bold text-foreground">{String(topReferer)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top URLs / Top Domains */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top URLs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Top URLs</CardTitle>
            </div>
            <CardDescription>Most clicked short links</CardDescription>
          </CardHeader>
          <CardContent>
            {topUrls.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No data available
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {topUrls.slice(0, 10).map((item: any, index: number) => (
                  <div
                    key={item.shortId ?? index}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-mono text-sm font-medium text-foreground">
                        {item.shortId}
                      </p>
                      {item.originalUrl && (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.originalUrl}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0 font-mono">
                      {Number(item.clicks || 0).toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Domains */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" />
              <CardTitle className="text-base">Top Domains</CardTitle>
            </div>
            <CardDescription>Most popular destination domains</CardDescription>
          </CardHeader>
          <CardContent>
            {topDomains.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No data available
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {topDomains.slice(0, 10).map((item: any, index: number) => {
                  const maxCount = topDomains[0]?.count || 1;
                  const widthPct = Math.max((Number(item.count || 0) / maxCount) * 100, 8);

                  return (
                    <div key={item.domain ?? index} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          <span className="truncate text-sm font-medium text-foreground">
                            {item.domain}
                          </span>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {Number(item.count || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patterns (Hour/Day/Referer) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Clicks by Hour</CardTitle>
            </div>
            <CardDescription>Top hours (last 7d)</CardDescription>
          </CardHeader>
          <CardContent>
            {hourEntries.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="flex flex-col gap-2">
                {hourEntries.map((h) => (
                  <div key={h.hour} className="flex items-center justify-between rounded-md border p-2">
                    <span className="font-mono text-sm text-foreground">{h.hour}:00</span>
                    <Badge variant="secondary">{h.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent" />
              <CardTitle className="text-base">Clicks by Day</CardTitle>
            </div>
            <CardDescription>Top days (last 7d)</CardDescription>
          </CardHeader>
          <CardContent>
            {dayEntries.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="flex flex-col gap-2">
                {dayEntries.map((d) => (
                  <div key={d.day} className="flex items-center justify-between rounded-md border p-2">
                    <span className="font-mono text-sm text-foreground">{d.day}</span>
                    <Badge variant="secondary">{d.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Referers</CardTitle>
            </div>
            <CardDescription>Top sources (last 7d)</CardDescription>
          </CardHeader>
          <CardContent>
            {refererEntries.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="flex flex-col gap-2">
                {refererEntries.map((r) => (
                  <div key={r.referer} className="flex items-center justify-between rounded-md border p-2">
                    <span className="truncate text-sm text-foreground">{r.referer}</span>
                    <Badge variant="secondary">{r.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights (Admin + User) */}
      {(adminLines.length > 0 || userLines.length > 0) && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">AI Insights</CardTitle>
            </div>
            <CardDescription>Operational insights and public tips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">Admin</p>
                {adminLines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No admin insights</p>
                ) : (
                  <ul className="space-y-2">
                    {adminLines.slice(0, 6).map((line, idx) => (
                      <li key={idx} className="text-sm leading-relaxed text-foreground">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">User</p>
                {userLines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No user insights</p>
                ) : (
                  <ul className="space-y-2">
                    {userLines.slice(0, 6).map((line, idx) => (
                      <li key={idx} className="text-sm leading-relaxed text-foreground">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
