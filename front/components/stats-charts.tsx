"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StatsResponse } from "@/types";

const CHART_COLORS = [
  "hsl(210, 100%, 50%)",
  "hsl(165, 70%, 42%)",
  "hsl(30, 90%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(270, 60%, 55%)",
];

interface StatsChartsProps {
  data: StatsResponse;
}

export function StatsCharts({ data }: StatsChartsProps) {
  const { stats } = data;

  // Transform clicks by hour into chart data
  const hourlyData = Object.entries(stats.clicksByHour)
    .map(([hour, clicks]) => ({
      hour: `${hour}:00`,
      clicks,
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  // Transform clicks by day into chart data
  const dailyData = Object.entries(stats.clicksByDay)
    .map(([day, clicks]) => ({
      day,
      clicks,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // Transform referer data for pie chart
  const refererData = Object.entries(stats.clicksByReferer).map(
    ([name, value]) => ({
      name: name || "direct",
      value,
    })
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Clicks"
          value={data.totalClicks.toLocaleString()}
        />
        <SummaryCard
          label="Peak Hour"
          value={`${stats.peakHour}:00`}
        />
        <SummaryCard
          label="Top Referer"
          value={stats.topReferer || "direct"}
        />
      </div>

      {/* Original URL info */}
      <Card>
        <CardContent className="flex flex-col gap-1 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Original URL
          </p>
          <a
            href={data.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-mono text-sm text-primary hover:underline"
          >
            {data.originalUrl}
          </a>
          {data.title && (
            <p className="text-sm text-muted-foreground">{data.title}</p>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clicks by Hour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clicks by Hour</CardTitle>
            <CardDescription>Hourly click distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                      fontSize: "13px",
                    }}
                  />
                  <Bar
                    dataKey="clicks"
                    fill="hsl(210, 100%, 50%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clicks by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clicks by Day</CardTitle>
            <CardDescription>Daily click trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                      fontSize: "13px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(165, 70%, 42%)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(165, 70%, 42%)" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Referer Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Referer Breakdown</CardTitle>
            <CardDescription>Where your clicks are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={refererData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {refererData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                {refererData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-sm text-foreground">{entry.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
