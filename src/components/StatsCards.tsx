"use client";

import React from "react";

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down" | "neutral";
  subtext?: string;
  icon: string;
  iconBg?: string;
  iconColor?: string;
}

interface StatsCardsProps {
  stats?: StatCardData[];
}

const defaultStats: StatCardData[] = [
  {
    id: "audience-reach",
    label: "Total Audience Reach",
    value: "1.42M",
    trend: "+14.8%",
    trendDirection: "up",
    subtext: "vs. previous 30 days",
    icon: "visibility",
    iconBg: "bg-[#FF4D36]/15",
    iconColor: "text-[#FF4D36]",
  },
  {
    id: "engagement-rate",
    label: "Avg. Engagement Rate",
    value: "5.84%",
    trend: "+1.2%",
    trendDirection: "up",
    subtext: "across active posts",
    icon: "trending_up",
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
  },
  {
    id: "scheduled-queue",
    label: "Scheduled in Queue",
    value: "18 Posts",
    trend: "+6 queued",
    trendDirection: "neutral",
    subtext: "Next post in 2h 15m",
    icon: "schedule",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
  {
    id: "publishing-velocity",
    label: "Publishing Success Rate",
    value: "99.4%",
    trend: "+0.4%",
    trendDirection: "up",
    subtext: "0 failed containers",
    icon: "verified",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
];

export default function StatsCards({ stats = defaultStats }: StatsCardsProps) {
  const [flagship, ...secondary] = stats;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
      {/* Flagship Hero Metric: Intentional Visual Focus (Span 6 Cols) */}
      {flagship && (
        <div
          key={flagship.id}
          className="group relative flex flex-col justify-between rounded-lg border border-[#262A36] bg-[#12141A] p-6 shadow-md transition-all sm:col-span-2 lg:col-span-6"
        >
          <div>
            <div className="flex items-center justify-between border-b border-[#1E212B] pb-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#FF755B]">
                {flagship.label}
              </span>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded ${
                  flagship.iconBg || "bg-[#1C1E26]"
                } ${flagship.iconColor || "text-white"}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {flagship.icon}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold tracking-tight text-white [font-variant-numeric:tabular-nums]">
                {flagship.value}
              </span>

              <div
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs font-semibold ${
                  flagship.trendDirection === "up"
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : flagship.trendDirection === "down"
                    ? "border border-red-500/30 bg-red-500/10 text-red-400"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300"
                }`}
              >
                {flagship.trendDirection === "up" && (
                  <span className="material-symbols-outlined text-[13px]">
                    arrow_upward
                  </span>
                )}
                <span>{flagship.trend}</span>
              </div>
            </div>

            {flagship.subtext && (
              <p className="mt-2 text-xs font-sans text-zinc-400 leading-relaxed">
                {flagship.subtext}
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-[#1E212B] pt-3 flex items-center justify-between font-mono text-[11px] text-zinc-500">
            <span>TELEMETRY: META GRAPH V21.0</span>
            <span className="text-emerald-400 font-semibold">VERIFIED SOURCE</span>
          </div>
        </div>
      )}

      {/* Secondary Metric Tiles: High-Density Technical Readouts (Span 3 Cols Each or 2 Cols Each) */}
      {secondary.map((stat) => {
        const isUp = stat.trendDirection === "up";
        const isDown = stat.trendDirection === "down";

        return (
          <div
            key={stat.id}
            className="flex flex-col justify-between rounded-lg border border-[#1F222B] bg-[#101115] p-4 shadow-sm transition-all sm:col-span-1 lg:col-span-2"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {stat.label}
                </span>

                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                    stat.iconBg || "bg-[#181A22]"
                  } ${stat.iconColor || "text-zinc-300"}`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {stat.icon}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-1">
                <span className="font-display text-xl font-bold tracking-tight text-white [font-variant-numeric:tabular-nums]">
                  {stat.value}
                </span>

                <span
                  className={`font-mono text-[10px] font-semibold ${
                    isUp
                      ? "text-emerald-400"
                      : isDown
                      ? "text-red-400"
                      : "text-zinc-400"
                  }`}
                >
                  {stat.trend}
                </span>
              </div>
            </div>

            {stat.subtext && (
              <div className="mt-3 truncate border-t border-[#1C1E26] pt-2 font-mono text-[10px] text-zinc-500">
                {stat.subtext}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
