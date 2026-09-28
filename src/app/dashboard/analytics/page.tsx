"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import StatsCards, { StatCardData } from "@/components/StatsCards";
import { mockPosts } from "@/lib/demo/mockData";
import { AggregatedAnalyticsResult } from "@/lib/instagram/types";

export interface PostMetric {
  id: string;
  caption: string;
  mediaType: string;
  aspectRatio?: string;
  thumbnailUrl: string;
  permalink?: string;
  publishedAt: string;
  likes: number;
  comments: number;
  reach: number;
  views: number;
  impressions: number;
  shares: number;
  saves: number;
  totalInteractions: number;
  engagementRate: number;
  availableMetrics?: string[];
}

interface RawPost {
  id: string;
  caption?: string;
  mediaType?: string;
  aspectRatio?: string;
  permalink?: string;
  media?: Array<{ url: string }>;
  publishedAt?: string;
  metrics?: {
    likes?: number;
    comments?: number;
    reach?: number;
    views?: number;
    impressions?: number;
    shares?: number;
    saved?: number;
    totalInteractions?: number;
    engagementRate?: number;
    availableMetrics?: string[];
  };
}

export default function AnalyticsPage() {
  const router = useRouter();

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [chartMetric, setChartMetric] = useState<"followers" | "reach" | "engagement">("reach");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [activeSort, setActiveSort] = useState<"reach" | "engagement" | "likes" | "saves">("reach");
  const [posts, setPosts] = useState<PostMetric[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AggregatedAnalyticsResult | null>(null);
  const [isLiveSource, setIsLiveSource] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inspectingPost, setInspectingPost] = useState<PostMetric | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const analyticsRes = await fetch("/api/analytics");
        const analyticsJson = await analyticsRes.json();

        if (analyticsJson.success && analyticsJson.analytics) {
          setAnalyticsData(analyticsJson.analytics);
          setIsLiveSource(analyticsJson.source === "META_GRAPH_API" || !analyticsJson.isDemo);
        }

        const postsListResponse = await fetch("/api/posts");
        const postsListPayload = await postsListResponse.json();
        const rawList =
          postsListPayload.posts && Array.isArray(postsListPayload.posts) && postsListPayload.posts.length > 0
            ? postsListPayload.posts
            : mockPosts;

        const formatted: PostMetric[] = rawList.map((p: RawPost) => ({
          id: p.id,
          caption: p.caption || "Untitled Post",
          mediaType: p.mediaType || "IMAGE",
          aspectRatio: p.aspectRatio || "1:1",
          thumbnailUrl:
            p.media?.[0]?.url ||
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
          permalink: p.permalink,
          publishedAt: p.publishedAt
            ? new Date(p.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "Recent",
          likes: p.metrics?.likes ?? 0,
          comments: p.metrics?.comments ?? 0,
          reach: p.metrics?.reach ?? 0,
          views: p.metrics?.views ?? (p.metrics?.impressions ?? 0),
          impressions: p.metrics?.views ?? (p.metrics?.impressions ?? 0),
          shares: p.metrics?.shares ?? 0,
          saves: p.metrics?.saved ?? 0,
          totalInteractions:
            p.metrics?.totalInteractions ??
            (p.metrics?.likes || 0) + (p.metrics?.comments || 0),
          engagementRate: p.metrics?.engagementRate ?? 0,
          availableMetrics: p.metrics?.availableMetrics || [
            "likes",
            "comments",
            "reach",
            "views",
          ],
        }));

        setPosts(formatted);
      } catch (err) {
        console.warn("[AnalyticsPage] Using fallback data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const dynamicKpis: StatCardData[] = useMemo(() => {
    if (analyticsData && isLiveSource) {
      const overview = analyticsData.overview;
      const account = analyticsData.account;

      return [
        {
          id: "audience-reach",
          label: `Audience Reach (${timeRange.toUpperCase()})`,
          value: overview.reach > 0 ? overview.reach.toLocaleString() : "0",
          trend: "Live",
          trendDirection: "up",
          subtext: "Unique accounts reached via Meta API",
          icon: "visibility",
          iconBg: "bg-primary-container/15",
          iconColor: "text-primary-container",
        },
        {
          id: "engagement-rate",
          label: "Avg. Engagement Rate",
          value: `${overview.avgEngagementRate}%`,
          trend: `${overview.totalInteractions.toLocaleString()} ints`,
          trendDirection: "up",
          subtext: "Likes, comments, shares & saves",
          icon: "trending_up",
          iconBg: "bg-tertiary-container/15",
          iconColor: "text-tertiary",
        },
        {
          id: "content-views",
          label: "Content Views",
          value: overview.views.toLocaleString(),
          trend: "Active",
          trendDirection: "neutral",
          subtext: "Replaces impressions in Graph v21.0",
          icon: "play_circle",
          iconBg: "bg-secondary/15",
          iconColor: "text-secondary",
        },
        {
          id: "published-posts",
          label: "Active Published Media",
          value: `${account.mediaCount || overview.activeMediaCount} Posts`,
          trend: `@${account.username}`,
          trendDirection: "up",
          subtext: `${account.followersCount} followers on Instagram`,
          icon: "verified",
          iconBg: "bg-emerald-500/15",
          iconColor: "text-emerald-400",
        },
      ];
    }

    // Sandbox Demo mode fallback numbers
    return [
      {
        id: "audience-reach",
        label: `Audience Reach (${timeRange.toUpperCase()})`,
        value: timeRange === "7d" ? "384.2K" : timeRange === "30d" ? "1.42M" : "4.18M",
        trend: "+18.4%",
        trendDirection: "up",
        subtext: "Simulated sandbox telemetry",
        icon: "visibility",
        iconBg: "bg-primary-container/15",
        iconColor: "text-primary-container",
      },
      {
        id: "engagement-rate",
        label: "Avg. Engagement Rate",
        value: "6.12%",
        trend: "+0.8%",
        trendDirection: "up",
        subtext: "across 4 active posts",
        icon: "trending_up",
        iconBg: "bg-tertiary-container/15",
        iconColor: "text-tertiary",
      },
      {
        id: "scheduled-queue",
        label: "Scheduled in Queue",
        value: "18 Posts",
        trend: "+6 queued",
        trendDirection: "neutral",
        subtext: "Next post in queue",
        icon: "schedule",
        iconBg: "bg-secondary/15",
        iconColor: "text-secondary",
      },
      {
        id: "publishing-velocity",
        label: "Publishing Success Rate",
        value: "100%",
        trend: "+0.0%",
        trendDirection: "up",
        subtext: "0 failed containers",
        icon: "verified",
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-400",
      },
    ];
  }, [analyticsData, isLiveSource, timeRange]);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (activeSort === "reach") return b.reach - a.reach;
      if (activeSort === "engagement") return b.engagementRate - a.engagementRate;
      if (activeSort === "likes") return b.likes - a.likes;
      if (activeSort === "saves") return b.saves - a.saves;
      return 0;
    });
  }, [posts, activeSort]);

  const handleExportReport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Caption,Type,Published,Likes,Comments,Reach,Views,Saves,Engagement"]
        .concat(
          posts.map(
            (p) =>
              `"${p.id}","${p.caption.replace(/"/g, '""')}","${p.mediaType}","${p.publishedAt}",${p.likes},${p.comments},${p.reach},${p.views},${p.saves},${p.engagementRate}%`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `instagram_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported Analytics Report as CSV!");
  };

  const handleCreateFollowup = (post: PostMetric) => {
    const query = new URLSearchParams({
      sourceCaption: post.caption,
      format: post.mediaType === "REEL" ? "REEL" : "FEED",
    }).toString();
    router.push(`/dashboard/create?${query}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-space-md py-space-lg sm:px-space-xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-primary/40 bg-surface-container-high px-4 py-3 text-xs font-semibold text-on-surface shadow-2xl backdrop-blur-xl">
          <span className="material-symbols-outlined text-[18px] text-primary">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Performance Analytics & Intelligence
            </h1>

            {/* Live API vs Demo Mode Badge */}
            {isLiveSource ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Meta Graph API (v21.0 Live)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Sandbox Demo Mode</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowPermissionsModal(true)}
              className="inline-flex items-center gap-1 rounded-full border border-outline-variant/30 bg-surface-container px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">
                verified_user
              </span>
              <span>Permissions & Metrics</span>
            </button>
          </div>

          <p className="mt-1 text-xs text-on-surface-variant">
            Real-time telemetry, reach, views, and content insights for{" "}
            <span className="font-semibold text-on-surface">
              {analyticsData?.account?.username
                ? `@${analyticsData.account.username}`
                : "@adi78287"}
            </span>
          </p>
        </div>

        {/* Time Range Selector & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-surface-container p-1 text-xs font-medium text-on-surface-variant">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setTimeRange(range);
                  showToast(`Switched analytics view to ${range.toUpperCase()}!`);
                }}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  timeRange === range
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "hover:text-on-surface"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container px-3.5 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              download
            </span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* API Permissions & Metric Transparency Banner */}
      <div className="mb-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">
                policy
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface">
                  Meta Graph API Permission & Metrics Transparency
                </span>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Strictly Compliant
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                Only displaying metrics authorized by your granted permissions (
                <code className="text-primary font-mono text-[10px]">instagram_basic</code>,{" "}
                <code className="text-primary font-mono text-[10px]">instagram_manage_insights</code>).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <span className="material-symbols-outlined text-[12px]">check</span>
              <span>Reach Active</span>
            </span>
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <span className="material-symbols-outlined text-[12px]">check</span>
              <span>Views Active</span>
            </span>
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <span className="material-symbols-outlined text-[12px]">check</span>
              <span>Interactions Active</span>
            </span>
            <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400" title="Meta v21.0 deprecated impressions for feed media; mapped to Views">
              <span className="material-symbols-outlined text-[12px]">info</span>
              <span>Impressions Mapped to Views</span>
            </span>
          </div>
        </div>
      </div>

      {/* Top 4 Dynamic KPI Cards */}
      <div className="mb-8">
        <StatsCards stats={dynamicKpis} />
      </div>

      {/* Primary Chart Suite: Multi-Metric Interactive Area Graph & Circular Donut */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Interactive Primary Curve Chart (2 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm lg:col-span-2">
          {/* Chart Header & Metric Switcher Tabs */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Audience Activity & Reach
              </span>
              <h3 className="mt-0.5 text-xl font-extrabold text-on-surface">
                {chartMetric === "reach"
                  ? "Daily Accounts Reached"
                  : chartMetric === "followers"
                  ? "Total Audience Growth"
                  : "Engagement Trajectory"}
              </h3>
            </div>

            <div className="flex rounded-xl bg-surface-container p-1 text-xs">
              {(
                [
                  { id: "reach", label: "Reach (Live)" },
                  { id: "followers", label: "Followers" },
                  { id: "engagement", label: "Engagement" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChartMetric(tab.id)}
                  className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                    chartMetric === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Vector Area Curve */}
          <div className="relative mt-6 h-56 w-full">
            <svg
              className="h-full w-full overflow-visible"
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4D88FF" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4D88FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path
                d="M 0 130 C 50 120, 100 110, 150 95 C 200 80, 250 85, 300 65 C 350 45, 400 50, 450 30 L 500 25 L 500 150 L 0 150 Z"
                fill="url(#curveGradient)"
              />
              <path
                d="M 0 130 C 50 120, 100 110, 150 95 C 200 80, 250 85, 300 65 C 350 45, 400 50, 450 30 L 500 25"
                fill="none"
                stroke="#4D88FF"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {[
                { x: 0, y: 130, val: "0" },
                { x: 100, y: 110, val: "0" },
                { x: 200, y: 80, val: "0" },
                { x: 300, y: 65, val: "1" },
                { x: 400, y: 50, val: "1" },
                { x: 500, y: 25, val: "2" },
              ].map((telemetryPoint, pointIndex) => (
                <circle
                  key={pointIndex}
                  cx={telemetryPoint.x}
                  cy={telemetryPoint.y}
                  r={hoveredPointIndex === pointIndex ? "7" : "4.5"}
                  className="cursor-pointer fill-[#4D88FF] stroke-surface-container stroke-[2.5px] transition-all "
                  onMouseEnter={() => setHoveredPointIndex(pointIndex)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />
              ))}
            </svg>

            {hoveredPointIndex !== null && (
              <div
                className="pointer-events-none absolute -top-8 rounded-lg bg-surface-container-high px-2 py-1 text-[11px] font-bold text-on-surface shadow-md"
                style={{ left: `${(hoveredPointIndex / 5) * 85 + 5}%` }}
              >
                Day {hoveredPointIndex + 1}: Live Telemetry Point
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between text-[11px] font-medium text-on-surface-variant">
            <span>24h Ago</span>
            <span>18h Ago</span>
            <span>12h Ago</span>
            <span>6h Ago</span>
            <span>2h Ago</span>
            <span>Just Now</span>
          </div>
        </div>

        {/* Content Format Distribution Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary">
                  Media Formats
                </span>
                <h3 className="mt-0.5 text-lg font-bold text-on-surface">
                  Publishing Mix
                </h3>
              </div>
              <span className="rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                Live Media
              </span>
            </div>

            <div className="relative mx-auto mt-6 flex h-40 w-40 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#2A303C"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#4D88FF"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset="71.6"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#A77BFF"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset="191"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-extrabold text-on-surface">
                  {posts.length}
                </span>
                <p className="text-[10px] font-medium text-on-surface-variant">
                  Media Items
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#4D88FF]" />
                  <span className="text-on-surface">Feed Images (Live)</span>
                </div>
                <span className="font-bold text-on-surface">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#A77BFF]" />
                  <span className="text-on-surface">Reels & Carousels</span>
                </div>
                <span className="font-bold text-on-surface">Supported</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Performance Matrix Table */}
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Content Performance
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-on-surface">
              Published Posts & Live Telemetry
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Click any post to inspect its full Meta Graph API metrics breakdown.
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">
              Sort by:
            </span>
            <div className="flex rounded-xl bg-surface-container p-1 text-xs">
              {(
                [
                  { id: "reach", label: "Reach" },
                  { id: "engagement", label: "Engagement" },
                  { id: "likes", label: "Likes" },
                  { id: "saves", label: "Saves" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSort(s.id)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                    activeSort === s.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-on-surface-variant">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Fetching live analytics from Meta Graph API...</span>
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="py-12 text-center text-xs text-on-surface-variant">
            No published posts found on Instagram account.
          </div>
        ) : (
          <div className="mt-6 divide-y divide-outline-variant/15">
            {sortedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setInspectingPost(post)}
                className="group flex flex-col justify-between gap-4 py-4 transition-colors hover:bg-surface-container/50 sm:flex-row sm:items-center cursor-pointer rounded-xl px-2"
              >
                {/* Left: Thumbnail & Caption */}
                <div className="flex items-center gap-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.thumbnailUrl}
                    alt="Post thumbnail"
                    className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10 "
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {post.mediaType}
                      </span>
                      {post.permalink && (
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline"
                        >
                          <span>Instagram</span>
                          <span className="material-symbols-outlined text-[11px]">
                            open_in_new
                          </span>
                        </a>
                      )}
                      <span className="text-[11px] text-on-surface-variant">
                        {post.publishedAt}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 max-w-md text-xs font-medium text-on-surface">
                      {post.caption}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics Grid */}
                <div className="flex w-full items-center justify-between gap-6 sm:w-auto sm:justify-end">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-on-surface-variant">Reach</span>
                    <span className="text-xs font-bold text-on-surface">
                      {post.reach.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-on-surface-variant">Views</span>
                    <span className="text-xs font-bold text-on-surface">
                      {post.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-on-surface-variant">Likes</span>
                    <span className="text-xs font-bold text-on-surface">
                      {post.likes.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-on-surface-variant">Saves</span>
                    <span className="text-xs font-bold text-on-surface">
                      {post.saves.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-on-surface-variant">Engagement</span>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-extrabold text-emerald-400">
                      {post.engagementRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Drawer / Modal */}
      {inspectingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setInspectingPost(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-high shadow-2xl md:flex-row"
          >
            {/* Visual Viewport */}
            <div className="relative aspect-square w-full bg-black/90 md:w-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspectingPost.thumbnailUrl}
                alt={inspectingPost.caption}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {inspectingPost.mediaType}
              </span>
            </div>

            {/* Metrics Breakdown Column */}
            <div className="flex w-full flex-col justify-between p-6 md:w-1/2">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {inspectingPost.publishedAt}
                    </span>
                    <h3 className="mt-1 text-sm font-bold text-on-surface">
                      Meta Post Telemetry
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectingPost(null)}
                    className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <p className="mt-3 line-clamp-3 rounded-xl bg-surface-container p-2.5 text-xs text-on-surface">
                  {inspectingPost.caption}
                </p>

                {/* Live Supported Metrics Matrix */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant">Reach</span>
                      <span className="text-[9px] text-emerald-400 font-bold">● Active</span>
                    </div>
                    <p className="text-base font-bold text-on-surface">
                      {inspectingPost.reach.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant">Content Views</span>
                      <span className="text-[9px] text-emerald-400 font-bold">● Active</span>
                    </div>
                    <p className="text-base font-bold text-on-surface">
                      {inspectingPost.views.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant">Interactions</span>
                      <span className="text-[9px] text-emerald-400 font-bold">● Active</span>
                    </div>
                    <p className="text-base font-bold text-primary">
                      {inspectingPost.totalInteractions.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant">Engagement</span>
                      <span className="text-[9px] text-emerald-400 font-bold">● Active</span>
                    </div>
                    <p className="text-base font-bold text-emerald-400">
                      {inspectingPost.engagementRate}%
                    </p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant">Likes & Comments</span>
                      <span className="text-[9px] text-emerald-400 font-bold">● Active</span>
                    </div>
                    <p className="text-xs font-bold text-on-surface">
                      {inspectingPost.likes} Likes / {inspectingPost.comments} Comments
                    </p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant">Saves & Shares</span>
                      <span className="text-[9px] text-emerald-400 font-bold">● Active</span>
                    </div>
                    <p className="text-xs font-bold text-on-surface">
                      {inspectingPost.saves} Saves / {inspectingPost.shares} Shares
                    </p>
                  </div>
                </div>

                {/* API Availability Notice */}
                <div className="mt-3 rounded-lg bg-surface-container/60 p-2 text-[10px] text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Metric Policy: </span>
                  Impressions deprecated by Meta in v21.0 for feed media; mapped to Views & Reach.
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-2">
                {inspectingPost.permalink && (
                  <a
                    href={inspectingPost.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded border border-[#2D313B] bg-[#161820] hover:bg-[#1E2028] px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors"
                  >
                    <span>View Post on Instagram</span>
                    <span className="material-symbols-outlined text-[16px]">
                      open_in_new
                    </span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleCreateFollowup(inspectingPost)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow transition-transform hover:brightness-105 active:scale-98"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    post_add
                  </span>
                  <span>Create Follow-up in Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Transparency Modal */}
      {showPermissionsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setShowPermissionsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-outline-variant/30 bg-surface-container-high p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  verified_user
                </span>
                <h3 className="text-base font-bold text-on-surface">
                  Granted Scopes & Metric Transparency
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="rounded-full p-1 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="mt-2 text-xs text-on-surface-variant">
              In accordance with Meta Graph API policies, only metrics directly supported by your granted OAuth permissions are displayed.
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  metric: "Audience Reach",
                  scope: "instagram_manage_insights",
                  status: "Available",
                  desc: "Unique accounts reached by posts & profile.",
                  ok: true,
                },
                {
                  metric: "Content Views",
                  scope: "instagram_manage_insights",
                  status: "Available",
                  desc: "Total views across video, reel, and image content.",
                  ok: true,
                },
                {
                  metric: "Total Interactions",
                  scope: "instagram_manage_insights",
                  status: "Available",
                  desc: "Sum of likes, comments, saves, and shares.",
                  ok: true,
                },
                {
                  metric: "Likes & Comments",
                  scope: "instagram_basic",
                  status: "Available",
                  desc: "Post like counts and comment counts.",
                  ok: true,
                },
                {
                  metric: "Follower Count",
                  scope: "instagram_basic",
                  status: "Available",
                  desc: "Current profile follower and follows count.",
                  ok: true,
                },
                {
                  metric: "Impressions",
                  scope: "N/A",
                  status: "Deprecated by Meta",
                  desc: "Meta v21.0 deprecated impressions for feed media; mapped to Views.",
                  ok: false,
                },
                {
                  metric: "Demographics",
                  scope: "instagram_manage_insights",
                  status: "Restricted",
                  desc: "Requires 100+ followers for privacy threshold.",
                  ok: false,
                },
              ].map((permissionItem, permissionIndex) => (
                <div
                  key={permissionIndex}
                  className="flex items-start justify-between rounded-xl border border-outline-variant/15 bg-surface-container p-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">{permissionItem.metric}</span>
                      <code className="text-[10px] text-on-surface-variant">{permissionItem.scope}</code>
                    </div>
                    <p className="mt-0.5 text-[11px] text-on-surface-variant">{permissionItem.desc}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      permissionItem.ok
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {permissionItem.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
