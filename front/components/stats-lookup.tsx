"use client";

import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StatsLookupProps {
  onSearch: (shortId: string) => void;
  isLoading: boolean;
}

export function StatsLookup({ onSearch, isLoading }: StatsLookupProps) {
  const [shortId, setShortId] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = shortId.trim();
      if (!trimmed) return;
      onSearch(trimmed);
    },
    [shortId, onSearch]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter short ID (e.g. abc123)"
          value={shortId}
          onChange={(e) => setShortId(e.target.value)}
          className="h-11 pl-10 font-mono text-sm"
          disabled={isLoading}
          aria-label="Short link ID"
        />
      </div>
      <Button type="submit" disabled={isLoading || !shortId.trim()} className="h-11">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "View Stats"
        )}
      </Button>
    </form>
  );
}
