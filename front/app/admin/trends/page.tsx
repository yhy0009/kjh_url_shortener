"use client";

import { TrendsLayout } from "@/components/TrendsLayout";
import { AdminTrendsContent } from "@/components/AdminTrendsContent";

export default function AdminTrendsPage() {
  return (
    <TrendsLayout
      view="admin"
      title="Admin Trend Analytics"
      description="Operational analytics and AI insights for the platform."
      Content={AdminTrendsContent}
    />
  );
}
