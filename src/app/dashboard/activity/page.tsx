"use client";

import React, { useState } from "react";

interface ActivityItem {
  id: string;
  type: "PUBLISH_SUCCESS" | "SCHEDULED" | "TOKEN_REFRESH" | "MEDIA_UPLOAD" | "DRAFT_SAVED";
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "info" | "warning";
  meta?: Record<string, unknown>;
}

const mockActivities: ActivityItem[] = [
  {
    id: "act_01",
    type: "PUBLISH_SUCCESS",
    title: "Post Published Live to Instagram",
    description: "Carousel container #18029384918234812 published to @luminous.studio via Meta Graph API.",
    timestamp: "2 hours ago",
    status: "success",
  },
  {
    id: "act_02",
    type: "SCHEDULED",
    title: "Post Scheduled in Pipeline",
    description: "Post '5 principles for effortless grid harmony' queued for Sep 17 at 12:00 PST.",
    timestamp: "5 hours ago",
    status: "info",
  },
  {
    id: "act_03",
    type: "TOKEN_REFRESH",
    title: "Meta Long-Lived Token Verified",
    description: "OAuth token checked: valid for 52 more days with scopes instagram_content_publish.",
    timestamp: "1 day ago",
    status: "success",
  },
  {
    id: "act_04",
    type: "MEDIA_UPLOAD",
    title: "High-Resolution Assets Ingested",
    description: "horizon_drop_neon_hero.jpg (2160x2160) uploaded and optimized for cloud delivery.",
    timestamp: "1 day ago",
    status: "info",
  },
  {
    id: "act_05",
    type: "DRAFT_SAVED",
    title: "New Editorial Draft Staged",
    description: "Saved 'Monochrome Editorial Concepts' with 4 hashtag tags.",
    timestamp: "2 days ago",
    status: "info",
  },
];

export default function ActivityPage() {
  const [filter, setFilter] = useState<string>("ALL");

  return (
    <div className="mx-auto max-w-5xl px-space-md py-space-lg sm:px-space-xl">
      {/* Header */}
      <div className="mb-space-lg">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Activity & System Logs
          </h1>
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
            Live Stream
          </span>
        </div>
        <p className="mt-1 text-xs text-on-surface-variant">
          Complete audit trail of publishing executions, Meta Graph container telemetry, and scheduled actions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-space-lg flex gap-2 border-b border-outline-variant/20 pb-3">
        {[
          { id: "ALL", label: "All Activities" },
          { id: "PUBLISH", label: "Publishing" },
          { id: "SECURITY", label: "Account & Tokens" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === tab.id
                ? "bg-surface-container-high text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="flex flex-col gap-3">
        {mockActivities.map((act) => {
          const icon =
            act.type === "PUBLISH_SUCCESS"
              ? "verified"
              : act.type === "SCHEDULED"
              ? "schedule"
              : act.type === "TOKEN_REFRESH"
              ? "key"
              : act.type === "MEDIA_UPLOAD"
              ? "cloud_upload"
              : "draft";

          const iconColor =
            act.status === "success"
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : act.status === "warning"
              ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
              : "text-primary bg-primary-container/10 border-primary/20";

          return (
            <div
              key={act.id}
              className="flex items-start gap-4 rounded-2xl border border-[#1E293B] bg-[#131B2A] p-4 transition-all hover:border-slate-700"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconColor}`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {icon}
                </span>
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#F8FAFC]">
                    {act.title}
                  </h4>
                  <span className="text-[11px] text-[#64748B]">
                    {act.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {act.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
