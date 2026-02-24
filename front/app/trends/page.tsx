"use client";

import { TrendsLayout } from "@/components/TrendsLayout";
import { UserTrendsContent } from "@/components/UserTrendsContent";

export default function TrendsPage() {
  return (
    <TrendsLayout
      view="user"
      title="Trend Insights"
      description="Explore public click trends and sharing tips."
      Content={UserTrendsContent}
    />
  );
}
