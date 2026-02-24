// "use client";

// import { Globe, Link2, Sparkles, MousePointerClick } from "lucide-react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import type { TrendsResponse } from "@/types";

// interface TrendsContentProps {
//   data: TrendsResponse;
// }

// function toInsightLines(insights: unknown): string[] {
//   // 최신: { admin: string[], user: string[] } 또는 { user: string[] }
//   if (insights && typeof insights === "object") {
//     const anyObj = insights as any;

//     if (Array.isArray(anyObj.user)) return anyObj.user.map(String).filter(Boolean);
//     if (Array.isArray(anyObj.admin)) return anyObj.admin.map(String).filter(Boolean);
//   }

//   // 구버전: string
//   if (typeof insights === "string") {
//     return insights
//       .split("\n")
//       .map((s) => s.trim())
//       .filter(Boolean);
//   }

//   return [];
// }

// export function TrendsContent({ data }: TrendsContentProps) {
//   const { stats, insights } = data.trend;

//   // user view면 insights.user만 내려오도록 했지만,
//   // 혹시 admin/user 둘 다 오거나 구버전 string이 와도 안전하게 처리
//   const insightLines = toInsightLines(insights);

//   return (
//     <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
//       {/* Total clicks summary */}
//       <Card>
//         <CardContent className="flex items-center gap-4 p-6">
//           <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
//             <MousePointerClick className="h-6 w-6 text-primary" />
//           </div>
//           <div>
//             <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
//               Total Clicks
//             </p>
//             <p className="text-3xl font-bold text-foreground">
//               {Number(stats.totalClicks || 0).toLocaleString()}
//             </p>
//           </div>
//           <Badge variant="secondary" className="ml-auto">
//             {data.period}
//           </Badge>
//         </CardContent>
//       </Card>

//       {/* Top URLs and Domains */}
//       <div className="grid gap-6 lg:grid-cols-2">
//         {/* Top URLs */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Link2 className="h-4 w-4 text-primary" />
//               <CardTitle className="text-base">Top URLs</CardTitle>
//             </div>
//             <CardDescription>Most clicked short links</CardDescription>
//           </CardHeader>
//           <CardContent>
//             {stats.topUrls.length === 0 ? (
//               <p className="py-4 text-center text-sm text-muted-foreground">
//                 No data available
//               </p>
//             ) : (
//               <div className="flex flex-col gap-3">
//                 {stats.topUrls.map((item: any, index: number) => (
//                   <div
//                     key={item.shortId}
//                     className="flex items-center gap-3 rounded-lg border bg-card p-3"
//                   >
//                     <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
//                       {index + 1}
//                     </span>
//                     <div className="flex-1 overflow-hidden">
//                       <p className="truncate font-mono text-sm font-medium text-foreground">
//                         {item.shortId}
//                       </p>
//                       {/* 백엔드에서 originalUrl을 안 내려주면 undefined일 수 있음 */}
//                       {item.originalUrl && (
//                         <p className="truncate text-xs text-muted-foreground">
//                           {item.originalUrl}
//                         </p>
//                       )}
//                     </div>
//                     <Badge variant="outline" className="shrink-0 font-mono">
//                       {item.clicks}
//                     </Badge>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Top Domains */}
//         <Card>
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Globe className="h-4 w-4 text-accent" />
//               <CardTitle className="text-base">Top Domains</CardTitle>
//             </div>
//             <CardDescription>Most popular destination domains</CardDescription>
//           </CardHeader>
//           <CardContent>
//             {stats.topDomains.length === 0 ? (
//               <p className="py-4 text-center text-sm text-muted-foreground">
//                 No data available
//               </p>
//             ) : (
//               <div className="flex flex-col gap-3">
//                 {stats.topDomains.map((item: any, index: number) => {
  
//                   const maxCount = stats.topDomains[0]?.count || 1;
//                   const widthPct = Math.max((item.count / maxCount) * 100, 8);

//                   return (
//                     <div key={item.domain} className="flex flex-col gap-1.5">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2">
//                           <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold text-muted-foreground">
//                             {index + 1}
//                           </span>
//                           <span className="text-sm font-medium text-foreground">
//                             {item.domain}
//                           </span>
//                         </div>
//                         <span className="font-mono text-sm text-muted-foreground">
//                           {item.count}
//                         </span>
//                       </div>
//                       <div className="h-2 overflow-hidden rounded-full bg-muted">
//                         <div
//                           className="h-full rounded-full bg-accent transition-all duration-500"
//                           style={{ width: `${widthPct}%` }}
//                         />
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* AI Insights */}
//       {insightLines.length > 0 && (
//         <Card className="border-primary/20">
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Sparkles className="h-4 w-4 text-primary" />
//               <CardTitle className="text-base">AI Insights</CardTitle>
//             </div>
//             <CardDescription>
//               Automated analysis powered by GPT-4o-mini
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="rounded-lg bg-muted/50 p-4">
//               <ul className="space-y-2">
//                 {insightLines.map((line, idx) => (
//                   <li
//                     key={idx}
//                     className="text-sm leading-relaxed text-foreground"
//                   >
//                     {line}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
