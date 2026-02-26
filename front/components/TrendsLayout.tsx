"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PeriodSelector } from "@/components/period-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getTrends } from "@/services/api";
import type { TrendsResponse, TrendPeriod } from "@/types";

export function TrendsLayout({
  view,
  title,
  description,
  Content, 
}: {
  view: "user" | "admin";
  title: string;
  description: string;
  Content: React.ComponentType<{ data: TrendsResponse }>;
}) {
  const [period, setPeriod] = useState<TrendPeriod>("1h");
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(
    async (p: TrendPeriod) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getTrends(p, view);
        setData(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load trends.";
        setError(message);
        toast.error("Could not load trends.");
      } finally {
        setIsLoading(false);
      }
    },
    [view]
  );

  useEffect(() => {
    fetchTrends(period);
  }, [period, fetchTrends]);

  return (
    <div className="flex flex-col gap-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <TrendingUp className="h-7 w-7 text-primary" />
            {title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} disabled={isLoading} />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {data && !isLoading && <Content data={data} />}

      {/* Loading indicator overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="sr-only">Loading trends data</span>
        </div>
      )}
    </div>
  );
}
