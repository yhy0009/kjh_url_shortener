"use client";

import { Globe, Sparkles, MousePointerClick, Clock, Tags } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrendsResponse } from "@/types";

interface UserTrendsContentProps {
  data: TrendsResponse;
}

function toInsightLines(insights: unknown): string[] {
  if (insights && typeof insights === "object") {
    const anyObj = insights as any;
    if (Array.isArray(anyObj.user)) return anyObj.user.map(String).filter(Boolean);
  }
  if (typeof insights === "string") {
    return insights
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function UserTrendsContent({ data }: UserTrendsContentProps) {
  const { stats, insights } = data.trend;
  const insightLines = toInsightLines(insights);

  const totalClicks = Number(stats.totalClicks || 0);
  const topDomain = stats.topDomains?.[0]?.domain ?? "-";
  const topDomainCount = stats.topDomains?.[0]?.count ?? 0;

  const peakHour = stats.peakHour ?? null;
  const peakHourLabel =
    peakHour === null || peakHour === undefined
      ? "-"
      : `${String(peakHour).padStart(2, "0")}:00`;

  const categories = stats.categoryCounts ?? [];
  const hasCategories = categories.length > 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* KPI Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Clicks */}
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

        {/* Top Domain */}
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Globe className="h-6 w-6 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Top Domain
              </p>
              <p className="truncate text-xl font-bold text-foreground">
                {topDomain}
              </p>
              <p className="text-xs text-muted-foreground">
                {topDomainCount.toLocaleString()} clicks (7d)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Best Share Time */}
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Best Share Time
              </p>
              <p className="text-2xl font-bold text-foreground">
                {peakHourLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                Peak click hour (UTC)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Domains + Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Domains */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" />
              <CardTitle className="text-base">Top Domains</CardTitle>
            </div>
            <CardDescription>Popular destination domains</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats.topDomains || stats.topDomains.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No data available
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.topDomains.slice(0, 5).map((item: any, index: number) => {
                  const maxCount = stats.topDomains[0]?.count || 1;
                  const widthPct = Math.max((item.count / maxCount) * 100, 8);

                  return (
                    <div key={item.domain} className="flex flex-col gap-1.5">
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

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Categories</CardTitle>
            </div>
            <CardDescription>What people click most</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasCategories ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No category data yet
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.slice(0, 6).map((c: any) => (
                  <div
                    key={c.category}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {String(c.category)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Number(c.count || 0).toLocaleString()} links
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {Number(c.count || 0).toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights (User) */}
      {insightLines.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">AI Insights</CardTitle>
            </div>
            <CardDescription>Sharing tips based on recent trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4">
              <ul className="space-y-2">
                {insightLines.slice(0, 6).map((line, idx) => (
                  <li key={idx} className="text-sm leading-relaxed text-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
