"use client";

import { cn } from "@/lib/utils";
import type { TrendPeriod } from "@/types";

const periods: { value: TrendPeriod; label: string }[] = [
  // { value: "1h", label: "Last Hour" },
  // { value: "24h", label: "Last 24 Hours" },
  // { value: "7d", label: "Last 7 Days" },
];

interface PeriodSelectorProps {
  value: TrendPeriod;
  onChange: (period: TrendPeriod) => void;
  disabled?: boolean;
}

export function PeriodSelector({
  value,
  onChange,
  disabled,
}: PeriodSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-1" role="radiogroup" aria-label="Trend period">
      {periods.map((period) => (
        <button
          key={period.value}
          role="radio"
          aria-checked={value === period.value}
          onClick={() => onChange(period.value)}
          disabled={disabled}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            value === period.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
