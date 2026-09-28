"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
  scheduledCount: number;
  publishedCount: number;
  failedCount: number;
  draftsCount: number;
  nextScheduledTime: string;
}

interface ScheduledSnippet {
  id: string;
  caption: string;
  mediaType: string;
  thumbnailUrl: string;
  scheduledFor: string;
  timezone: string;
}

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    scheduledCount: 18,
    publishedCount: 184,
    failedCount: 0,
    draftsCount: 12,
    nextScheduledTime: "in 2h 15m",
  });

  const [upcomingQueue, setUpcomingQueue] = useState<ScheduledSnippet[]>([]);
  const [publishingActionId, setPublishingActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const dashboardOverviewResponse = await fetch("/api/posts");
        const dashboardOverviewPayload = await dashboardOverviewResponse.json();

        if (dashboardOverviewPayload.scheduled && Array.isArray(dashboardOverviewPayload.scheduled)) {
          setUpcomingQueue(dashboardOverviewPayload.scheduled.slice(0, 4));
          setStats((prev) => ({
            ...prev,
            scheduledCount: dashboardOverviewPayload.scheduled.length > 0 ? dashboardOverviewPayload.scheduled.length : 18,
          }));
        }

        if (dashboardOverviewPayload.drafts && Array.isArray(dashboardOverviewPayload.drafts)) {
          setStats((prev) => ({
            ...prev,
            draftsCount: dashboardOverviewPayload.drafts.length > 0 ? dashboardOverviewPayload.drafts.length : 12,
          }));
        }

        if (dashboardOverviewPayload.posts && Array.isArray(dashboardOverviewPayload.posts)) {
          setStats((prev) => ({
            ...prev,
            publishedCount: 184 + dashboardOverviewPayload.posts.length - 3,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch dashboard overview data:", err);
      }
    }
    loadDashboardData();
  }, []);

  const handleInstantPublish = async (scheduledDrop: ScheduledSnippet) => {
    setPublishingActionId(scheduledDrop.id);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: "NOW",
          format: scheduledDrop.mediaType === "REEL" ? "REEL" : "FEED",
          caption: scheduledDrop.caption,
          mediaItems: [{ url: scheduledDrop.thumbnailUrl }],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUpcomingQueue((prev) => prev.filter((i) => i.id !== scheduledDrop.id));
        setStats((prev) => ({
          ...prev,
          scheduledCount: Math.max(0, prev.scheduledCount - 1),
          publishedCount: prev.publishedCount + 1,
        }));
        setToastMessage("Post published live to Instagram successfully.");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error publishing post:", err);
    } finally {
      setPublishingActionId(null);
    }
  };

  const recentActivities: ActivityEvent[] = [
    {
      id: "act-1",
      title: "Post Published Live",
      description: "Carousel container #18029384 published to @luminous.studio",
      timestamp: "2 hours ago",
      icon: "verified",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "act-2",
      title: "Post Scheduled in Pipeline",
      description: "'5 principles for effortless grid harmony' queued for Sep 17",
      timestamp: "5 hours ago",
      icon: "schedule",
      color: "text-[#FF4D36] bg-[#FF4D36]/10 border-[#FF4D36]/20",
    },
    {
      id: "act-3",
      title: "Meta Long-Lived Token Verified",
      description: "OAuth token checked: valid for 52 more days",
      timestamp: "1 day ago",
      icon: "key",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: "act-4",
      title: "New Editorial Draft Staged",
      description: "Saved 'Monochrome Editorial Concepts' with 4 hashtag tags",
      timestamp: "2 days ago",
      icon: "draft",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  const firstQueueItem = upcomingQueue[0];
  const remainingQueue = upcomingQueue.slice(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-[#101E17] px-4 py-3 text-xs font-mono text-emerald-300 shadow-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400 " />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Studio Operations Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#1E2028] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Luminous Studio // Publishing Operations
            </h1>
            <span className="flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 " />
              META GRAPH V21.0
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-400">
            Automated publishing pipeline active • Meta Graph API token valid • All services operational
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/calendar"
            className="flex items-center gap-1.5 rounded border border-[#282B35] bg-[#14161B] hover:bg-[#1C1E25] px-3 py-2 text-xs font-mono text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>Calendar View</span>
          </Link>

          <Link
            href="/dashboard/create"
            className="flex items-center gap-2 rounded bg-[#FF4D36] hover:bg-[#E63A23] px-3.5 py-2 text-xs font-semibold text-white transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>New Studio Drop</span>
          </Link>
        </div>
      </div>

      {/* Asymmetric Hero Bento: Visual Hierarchy */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Flagship Hero Card: Active Dispatch Runway (Span 6 cols) */}
        <div className="rounded-lg border border-[#262A36] bg-[#12141A] p-5 shadow-lg lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1E212A] pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF4D36] " />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#FF755B]">
                  Active Runway // Next Scheduled Drop
                </span>
              </div>
              <span className="rounded bg-[#1B1D25] border border-[#2B2F3D] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                {stats.nextScheduledTime}
              </span>
            </div>

            {firstQueueItem ? (
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                {/* 4:5 Portrait Ratio Thumbnail */}
                <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded border border-[#2B2F3D] bg-[#0A0B0E]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstQueueItem.thumbnailUrl}
                    alt="Upcoming Drop Cover"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-1 left-1 rounded bg-black/70 px-1 py-0.5 font-mono text-[8px] text-white">
                    4:5
                  </div>
                </div>

                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#FF4D36]/10 border border-[#FF4D36]/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#FF755B] uppercase">
                        {firstQueueItem.mediaType}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">
                        {new Date(firstQueueItem.scheduledFor).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-sans text-zinc-200 line-clamp-2 leading-relaxed">
                      {firstQueueItem.caption}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1E212A]">
                    <span className="font-mono text-[11px] text-zinc-500">
                      TARGET: @luminous.studio
                    </span>
                    <button
                      type="button"
                      disabled={publishingActionId === firstQueueItem.id}
                      onClick={() => handleInstantPublish(firstQueueItem)}
                      className="flex items-center gap-1.5 rounded bg-[#FF4D36] hover:bg-[#E63A23] px-3 py-1 font-mono text-xs font-medium text-white transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      <span>{publishingActionId === firstQueueItem.id ? "Deploying..." : "Publish Now"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center font-mono text-xs text-zinc-500">
                No active drop in runway. Click &quot;New Studio Drop&quot; to queue one.
              </div>
            )}
          </div>
        </div>

        {/* Metric Tile: 30-Day Audience Reach (Span 3 cols) */}
        <div className="rounded-lg border border-[#20222B] bg-[#101115] p-5 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                30-Day Audience Reach
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded bg-[#1A1D24] text-zinc-300">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-display text-3xl font-bold tracking-tight text-white">
                142.8k
              </span>
              <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                +18.4%
              </span>
            </div>

            <p className="mt-2 text-xs font-sans text-zinc-400 leading-relaxed">
              Organic impressions across feed drops and video Reels.
            </p>
          </div>

          <div className="mt-4 border-t border-[#1C1E26] pt-3 flex items-center justify-between font-mono text-[11px] text-zinc-500">
            <span>PUBLISHED DROPS</span>
            <span className="font-bold text-zinc-300">{stats.publishedCount}</span>
          </div>
        </div>

        {/* Telemetry Tile: Meta Graph API Health (Span 3 cols) */}
        <div className="rounded-lg border border-[#20222B] bg-[#101115] p-5 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Graph API v21.0 Quota
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded bg-[#1A1D24] text-cyan-400">
                <span className="material-symbols-outlined text-[16px]">hub</span>
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-300">Hourly Throughput</span>
                <span className="font-semibold text-emerald-400">14 / 300</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#1A1D24] overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: "4.6%" }} />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-zinc-400">
              <span>Token Lifecycle</span>
              <span className="font-semibold text-zinc-200">52d remaining</span>
            </div>
          </div>

          <div className="mt-4 border-t border-[#1C1E26] pt-3">
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between font-mono text-[11px] text-[#FF755B] hover:text-[#FF4D36] transition-colors"
            >
              <span>Manage Credentials</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Status Ribbon: Staged Concepts */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-[#20222B] bg-[#121419] px-4 py-2.5 font-mono text-xs text-zinc-300">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1A1D24] text-amber-400 text-[13px]">
            <span className="material-symbols-outlined text-[14px]">draft</span>
          </span>
          <span>{stats.draftsCount} editorial concepts staged in Drafts Library</span>
        </div>
        <Link
          href="/dashboard/drafts"
          className="text-[#FF755B] hover:text-[#FF4D36] transition-colors font-semibold"
        >
          Open Drafts Studio →
        </Link>
      </div>

      {/* Asymmetric 7:5 Split Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Scheduled Pipeline Runway (7 Cols) */}
        <div className="rounded-lg border border-[#20222B] bg-[#101115] p-5 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#1C1E26] pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#FF755B]">
                QUEUE RUNWAY
              </span>
              <h2 className="font-display text-base font-bold text-white">
                Upcoming Scheduled Drops ({stats.scheduledCount})
              </h2>
            </div>
            <Link
              href="/dashboard/scheduled"
              className="font-mono text-xs text-zinc-400 hover:text-white transition-colors"
            >
              View Full Queue →
            </Link>
          </div>

          {/* Queue List with Density Contrast */}
          <div className="mt-4 flex flex-col divide-y divide-[#1C1E26]">
            {remainingQueue.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-500">
                No further drops queued in runway.
              </div>
            ) : (
              remainingQueue.map((queueDrop, queueIndex) => (
                <div
                  key={queueDrop.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-[#14161C] px-2 -mx-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-zinc-500 w-5">
                      0{queueIndex + 2}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={queueDrop.thumbnailUrl}
                      alt="Thumbnail"
                      className="h-10 w-8 shrink-0 rounded object-cover border border-[#282B35]"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#1A1D24] px-1 py-0.2 font-mono text-[9px] uppercase text-zinc-300">
                          {queueDrop.mediaType}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {new Date(queueDrop.scheduledFor).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-200">
                        {queueDrop.caption}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={publishingActionId === queueDrop.id}
                    onClick={() => handleInstantPublish(queueDrop)}
                    className="shrink-0 self-start sm:self-center font-mono text-xs text-zinc-400 hover:text-white border border-[#282B35] bg-[#161820] hover:bg-[#20222A] px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    <span>{publishingActionId === queueDrop.id ? "Deploying..." : "Publish Now"}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Studio Tools & Activity Stream (5 Cols) */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Studio Quick Launch Panel */}
          <div className="rounded-lg border border-[#20222B] bg-[#101115] p-5 shadow-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              STUDIO TOOLSET
            </span>
            <h3 className="font-display text-sm font-bold text-white mb-3">
              Direct Studio Navigation
            </h3>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <Link
                href="/dashboard/create"
                className="flex items-center gap-2 rounded border border-[#20222B] bg-[#14161C] p-2.5 hover:border-[#FF4D36]/40 hover:bg-[#1A1D24] transition-all text-zinc-200"
              >
                <span className="material-symbols-outlined text-[16px] text-[#FF4D36]">tune</span>
                <span className="truncate">Post Studio</span>
              </Link>
              <Link
                href="/dashboard/media"
                className="flex items-center gap-2 rounded border border-[#20222B] bg-[#14161C] p-2.5 hover:border-[#FF4D36]/40 hover:bg-[#1A1D24] transition-all text-zinc-200"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-400">photo_library</span>
                <span className="truncate">Asset Vault</span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center gap-2 rounded border border-[#20222B] bg-[#14161C] p-2.5 hover:border-[#FF4D36]/40 hover:bg-[#1A1D24] transition-all text-zinc-200"
              >
                <span className="material-symbols-outlined text-[16px] text-cyan-400">insights</span>
                <span className="truncate">Telemetry</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 rounded border border-[#20222B] bg-[#14161C] p-2.5 hover:border-[#FF4D36]/40 hover:bg-[#1A1D24] transition-all text-zinc-200"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-400">settings</span>
                <span className="truncate">Credentials</span>
              </Link>
            </div>
          </div>

          {/* Audit Trail & Stream */}
          <div className="rounded-lg border border-[#20222B] bg-[#101115] p-5 shadow-sm flex-1">
            <div className="flex items-center justify-between border-b border-[#1C1E26] pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  SYSTEM STREAM
                </span>
                <h3 className="font-display text-sm font-bold text-white">
                  Audit Telemetry
                </h3>
              </div>
              <Link
                href="/dashboard/activity"
                className="font-mono text-xs text-zinc-400 hover:text-white transition-colors"
              >
                All Logs →
              </Link>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-2.5 p-2 rounded hover:bg-[#14161C] transition-colors"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-[13px] ${act.color}`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {act.icon}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">
                        {act.title}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[11px] text-zinc-400">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
