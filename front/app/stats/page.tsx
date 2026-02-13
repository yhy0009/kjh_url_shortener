"use client";

import { useState, useCallback } from "react";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { StatsLookup } from "@/components/stats-lookup";
import { StatsCharts } from "@/components/stats-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getStats } from "@/services/api";
import type { StatsResponse } from "@/types";

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (shortId: string) => {
    setIsLoading(true);
    setError(null);
    setStats(null);

    try {
      const data = await getStats(shortId);
      setStats(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load stats.";
      setError(message);
      toast.error("Could not load statistics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Page heading */}
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
          <BarChart3 className="h-7 w-7 text-primary" />
          Link Statistics
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Enter a short link ID to view detailed click analytics and referrer
          data.
        </p>
      </div>

      {/* Search */}
      <StatsLookup onSearch={handleSearch} isLoading={isLoading} />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats data */}
      {stats && <StatsCharts data={stats} />}

      {/* Empty state */}
      {!isLoading && !error && !stats && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <BarChart3 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Search for a short link to see its analytics
          </p>
        </div>
      )}
    </div>
  );
}
