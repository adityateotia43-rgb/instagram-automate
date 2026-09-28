"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ScheduledItem {
  id: string;
  postId?: string;
  caption: string;
  mediaType: string;
  thumbnailUrl: string;
  scheduledFor: string;
  timezone: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  aspectRatio?: string;
}

export default function ScheduledPage() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PROCESSING">("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [rescheduleModalItem, setRescheduleModalItem] = useState<ScheduledItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleTimezone, setRescheduleTimezone] = useState("PST (UTC-8)");
  const [isRescheduling, setIsRescheduling] = useState(false);

  const fetchScheduled = async () => {
    try {
      const queueApiResponse = await fetch("/api/posts?type=scheduled");
      const queuePayload = await queueApiResponse.json();
      if (queuePayload.scheduled && Array.isArray(queuePayload.scheduled)) {
        setScheduledPosts(queuePayload.scheduled);
      }
    } catch (err) {
      console.error("Failed to load scheduled posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleCancelPost = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled post?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/posts?id=${id}&type=scheduled`, {
        method: "DELETE",
      });
      if (res.ok) {
        setScheduledPosts((prev) => prev.filter((scheduledDrop) => scheduledDrop.id !== id));
        setToastMessage("Scheduled post successfully cancelled.");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error cancelling scheduled post:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePublishNow = async (scheduledDrop: ScheduledItem) => {
    setActionLoadingId(scheduledDrop.id);
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
        await fetch(`/api/posts?id=${scheduledDrop.id}&type=scheduled`, { method: "DELETE" });
        setScheduledPosts((prev) => prev.filter((i) => i.id !== scheduledDrop.id));
        setToastMessage("Post published live to Instagram successfully.");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error publishing post immediately:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReschedule = (scheduledDrop: ScheduledItem) => {
    setRescheduleModalItem(scheduledDrop);
    setRescheduleTimezone(scheduledDrop.timezone || "PST (UTC-8)");

    const dateObj = new Date(scheduledDrop.scheduledFor);
    if (!isNaN(dateObj.getTime())) {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const hh = String(dateObj.getHours()).padStart(2, "0");
      const min = String(dateObj.getMinutes()).padStart(2, "0");
      setRescheduleDate(`${yyyy}-${mm}-${dd}`);
      setRescheduleTime(`${hh}:${min}`);
    } else {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      setRescheduleDate(`${yyyy}-${mm}-${dd}`);
      setRescheduleTime("18:45");
    }
  };

  const handleApplyAiBestTime = () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setRescheduleDate(`${yyyy}-${mm}-${dd}`);
    setRescheduleTime("18:45");
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleModalItem) return;
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select both a date and a time.");
      return;
    }

    setIsRescheduling(true);
    const newScheduledFor = `${rescheduleDate}T${rescheduleTime}:00`;

    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rescheduleModalItem.id,
          scheduledFor: newScheduledFor,
          timezone: rescheduleTimezone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScheduledPosts((prev) =>
          prev.map((scheduledPost) =>
            scheduledPost.id === rescheduleModalItem.id
              ? {
                  ...scheduledPost,
                  scheduledFor: newScheduledFor,
                  timezone: rescheduleTimezone,
                }
              : scheduledPost
          )
        );
        setToastMessage(`Post rescheduled for ${rescheduleDate} at ${rescheduleTime}.`);
        setTimeout(() => setToastMessage(null), 4000);
        setRescheduleModalItem(null);
      } else {
        alert(data.error || "Failed to reschedule post.");
      }
    } catch (err) {
      console.error("Error rescheduling post:", err);
      alert("Failed to reschedule post.");
    } finally {
      setIsRescheduling(false);
    }
  };

  const filteredScheduledPosts = scheduledPosts.filter((scheduledDrop) => {
    if (filter === "ALL") return true;
    return scheduledDrop.status === filter;
  });

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

      {/* Page Header */}
      <div className="mb-space-lg flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Scheduled Queue
            </h1>
            <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary">
              {scheduledPosts.length} Active Slots
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Automated calendar pipeline and background publishing execution window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/create"
            className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-xs font-semibold text-on-primary-container shadow-[0_0_20px_-3px_rgba(255,76,131,0.3)] transition-all hover:brightness-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Schedule New Post</span>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-space-lg flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <div className="flex gap-2">
          {(["ALL", "PENDING", "PROCESSING"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === tab
                  ? "bg-surface-container-high font-bold text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab === "ALL" ? `All Queued (${scheduledPosts.length})` : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">
            sync
          </span>
          <span>Worker: Active (every 1 min)</span>
        </div>
      </div>

      {/* Queue Items */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredScheduledPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1E293B] bg-[#131B2A]/50 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-[24px]">
              schedule_send
            </span>
          </div>
          <h3 className="mt-4 text-base font-bold text-on-surface">
            No Scheduled Posts in Queue
          </h3>
          <p className="mt-1 max-w-sm text-xs text-on-surface-variant">
            Plan ahead by scheduling your next high-converting feed post, reel, or carousel with automated best-time optimization.
          </p>
          <Link
            href="/dashboard/create"
            className="mt-6 flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Compose Post</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredScheduledPosts.map((scheduledDrop) => {
            const dateObj = new Date(scheduledDrop.scheduledFor);
            const dateFormatted = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Upcoming";
            const timeFormatted = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "18:00";

            return (
              <div
                key={scheduledDrop.id}
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-[#1E293B] bg-[#131B2A] p-5 shadow-sm transition-all hover:border-slate-700 sm:flex-row sm:items-center"
              >
                {/* Left: Thumbnail, Details, and Caption */}
                <div className="flex items-start gap-4">
                  {/* Media Thumbnail */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-container ring-1 ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={scheduledDrop.thumbnailUrl}
                      alt="Scheduled thumbnail"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[9px] font-bold uppercase text-white backdrop-blur-sm">
                      {scheduledDrop.aspectRatio || "1:1"}
                    </span>
                  </div>

                  {/* Caption & Metadata */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {scheduledDrop.mediaType}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <span className="inline-block h-2 w-2  rounded-full bg-emerald-400" />
                        <span>{scheduledDrop.status}</span>
                      </div>
                      <span className="text-[11px] text-outline">•</span>
                      <span className="text-[11px] font-medium text-[#94A3B8]">
                        {scheduledDrop.timezone}
                      </span>
                    </div>

                    <p className="line-clamp-2 max-w-xl text-xs font-medium text-on-surface">
                      {scheduledDrop.caption}
                    </p>

                    {/* Scheduled Slot Pill */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC]">
                      <span className="material-symbols-outlined text-[15px] text-primary">
                        calendar_today
                      </span>
                      <span>
                        {dateFormatted} at {timeFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#1E293B] pt-3 sm:border-t-0 sm:pt-0">
                  {/* Reschedule Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenReschedule(scheduledDrop)}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary-container/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-container/20"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      edit_calendar
                    </span>
                    <span>Reschedule</span>
                  </button>

                  {/* Publish Now Button */}
                  <button
                    type="button"
                    disabled={actionLoadingId === scheduledDrop.id}
                    onClick={() => handlePublishNow(scheduledDrop)}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      rocket_launch
                    </span>
                    <span>Publish Now</span>
                  </button>

                  {/* Cancel Button */}
                  <button
                    type="button"
                    disabled={actionLoadingId === scheduledDrop.id}
                    onClick={() => handleCancelPost(scheduledDrop.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      close
                    </span>
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Reschedule Modal */}
      {rescheduleModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1E293B] bg-[#131B2A] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  edit_calendar
                </span>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Reschedule Post
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalItem(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Post Preview Snippet */}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-container p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rescheduleModalItem.thumbnailUrl}
                alt="Thumbnail"
                className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-on-surface">
                  {rescheduleModalItem.caption}
                </span>
                <span className="mt-0.5 text-[11px] text-primary">
                  Current: {new Date(rescheduleModalItem.scheduledFor).toLocaleString()}
                </span>
              </div>
            </div>

            {/* AI Best Time Recommendation Chip */}
            <button
              type="button"
              onClick={handleApplyAiBestTime}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#262A34] bg-[#161820] hover:border-[#FF4D36]/40 p-3 text-left transition-all rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  auto_awesome
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#F8FAFC]">
                    AI Recommended Publishing Slot
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    Tomorrow at 18:45 (Peak creator audience reach)
                  </span>
                </div>
              </div>
              <span className="rounded bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                Apply
              </span>
            </button>

            {/* Date & Time Picker */}
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="rounded-xl border border-[#1E293B] bg-surface-container px-3 py-2 text-xs font-medium text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">
                    Publication Time
                  </label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="rounded-xl border border-[#1E293B] bg-surface-container px-3 py-2 text-xs font-medium text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Timezone Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#94A3B8]">
                  Target Timezone
                </label>
                <select
                  value={rescheduleTimezone}
                  onChange={(e) => setRescheduleTimezone(e.target.value)}
                  className="rounded-xl border border-[#1E293B] bg-surface-container px-3 py-2 text-xs font-medium text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="PST (UTC-8)">PST (UTC-8) - Pacific Time</option>
                  <option value="EST (UTC-5)">EST (UTC-5) - Eastern Time</option>
                  <option value="UTC (UTC+0)">UTC (UTC+0) - Coordinated Universal</option>
                  <option value="GMT (UTC+0)">GMT (UTC+0) - London / UK</option>
                  <option value="CET (UTC+1)">CET (UTC+1) - Paris, Berlin</option>
                  <option value="IST (UTC+5:30)">IST (UTC+5:30) - India Standard Time</option>
                  <option value="JST (UTC+9)">JST (UTC+9) - Tokyo / Japan</option>
                  <option value="AEST (UTC+10)">AEST (UTC+10) - Sydney / Australia</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#1E293B] pt-4">
              <button
                type="button"
                onClick={() => setRescheduleModalItem(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRescheduling}
                onClick={handleConfirmReschedule}
                className="flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2 text-xs font-bold text-on-primary-container shadow-[0_0_20px_-3px_rgba(255,76,131,0.4)] transition-all hover:brightness-105 disabled:opacity-50"
              >
                {isRescheduling && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>{isRescheduling ? "Saving..." : "Confirm Reschedule"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
