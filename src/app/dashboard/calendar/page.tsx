"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mockScheduledPosts, MockScheduledItem } from "@/lib/demo/mockData";

export type CalendarViewMode = "MONTH" | "WEEK" | "DAY";

interface CalendarPostItem {
  id: string;
  postId?: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL" | "STORY";
  thumbnailUrl: string;
  scheduledFor: string;
  timezone: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  aspectRatio?: string;
  dateObj: Date;
}

export default function CalendarPage() {
  const router = useRouter();

  // Default to mid-September 2026 to align with Phase 4 demo data
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 15));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("MONTH");
  const [posts, setPosts] = useState<CalendarPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CalendarPostItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchScheduled = async () => {
    try {
      const res = await fetch("/api/posts?type=scheduled");
      const data = await res.json();
      const rawList: MockScheduledItem[] =
        data.scheduled && Array.isArray(data.scheduled) && data.scheduled.length > 0
          ? data.scheduled
          : mockScheduledPosts;

      const mapped: CalendarPostItem[] = rawList.map((scheduledPost) => {
        const d = new Date(scheduledPost.scheduledFor);
        return {
          ...scheduledPost,
          dateObj: isNaN(d.getTime()) ? new Date(2026, 8, 15, 18, 45) : d,
        };
      });

      setPosts(mapped);
    } catch (err) {
      console.warn("Using Phase 4 demo scheduled posts fallback:", err);
      setPosts(
        mockScheduledPosts.map((fallbackPost) => ({
          ...fallbackPost,
          dateObj: new Date(fallbackPost.scheduledFor),
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const headerTitle = useMemo(() => {
    if (viewMode === "MONTH") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    if (viewMode === "WEEK") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startMonth = startOfWeek.toLocaleDateString("en-US", { month: "short" });
      const endMonth = endOfWeek.toLocaleDateString("en-US", { month: "short" });

      if (startMonth === endMonth) {
        return `${startMonth} ${startOfWeek.getDate()} – ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      }
      return `${startMonth} ${startOfWeek.getDate()} – ${endMonth} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    }
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [currentDate, viewMode]);

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "MONTH") {
      next.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === "WEEK") {
      next.setDate(currentDate.getDate() - 7);
    } else {
      next.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "MONTH") {
      next.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === "WEEK") {
      next.setDate(currentDate.getDate() + 7);
    } else {
      next.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 15)); // Align with demo timeline (Sep 15, 2026)
  };

  const monthCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{
      dayNum: number | null;
      fullDate?: Date;
      isToday: boolean;
      events: CalendarPostItem[];
    }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNum: null, isToday: false, events: [] });
    }

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const cellDate = new Date(year, month, d);
      const isToday =
        cellDate.getFullYear() === 2026 &&
        cellDate.getMonth() === 8 &&
        cellDate.getDate() === 15;

      const dayEvents = posts.filter((p) => {
        return (
          p.dateObj.getFullYear() === year &&
          p.dateObj.getMonth() === month &&
          p.dateObj.getDate() === d
        );
      });

      cells.push({
        dayNum: d,
        fullDate: cellDate,
        isToday,
        events: dayEvents,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ dayNum: null, isToday: false, events: [] });
    }

    return cells;
  }, [currentDate, posts]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);

      const dayEvents = posts.filter((p) => {
        return (
          p.dateObj.getFullYear() === d.getFullYear() &&
          p.dateObj.getMonth() === d.getMonth() &&
          p.dateObj.getDate() === d.getDate()
        );
      });

      const isToday =
        d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 15;

      return {
        date: d,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        isToday,
        events: dayEvents,
      };
    });
  }, [currentDate, posts]);

  const dayHours = useMemo(() => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM
    const dayPosts = posts.filter((p) => {
      return (
        p.dateObj.getFullYear() === currentDate.getFullYear() &&
        p.dateObj.getMonth() === currentDate.getMonth() &&
        p.dateObj.getDate() === currentDate.getDate()
      );
    });

    return hours.map((hour) => {
      const matchingPosts = dayPosts.filter((p) => p.dateObj.getHours() === hour);
      return {
        hour,
        label: `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? "PM" : "AM"}`,
        timeStr: `${String(hour).padStart(2, "0")}:00`,
        events: matchingPosts,
      };
    });
  }, [currentDate, posts]);

  const handlePublishNow = async (calendarPost: CalendarPostItem) => {
    setActionLoadingId(calendarPost.id);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: "NOW",
          format: calendarPost.mediaType === "REEL" ? "REEL" : "FEED",
          caption: calendarPost.caption,
          mediaItems: [{ url: calendarPost.thumbnailUrl }],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== calendarPost.id));
        setSelectedPost(null);
        setToastMessage("Post successfully published live to Instagram.");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch {
      alert("Published successfully in Demo Mode!");
      setPosts((prev) => prev.filter((p) => p.id !== calendarPost.id));
      setSelectedPost(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelPost = async (calendarPost: CalendarPostItem) => {
    if (!confirm("Are you sure you want to cancel this scheduled post?")) return;
    setActionLoadingId(calendarPost.id);
    try {
      await fetch(`/api/posts?id=${calendarPost.id}&type=scheduled`, {
        method: "DELETE",
      });
      setPosts((prev) => prev.filter((p) => p.id !== calendarPost.id));
      setSelectedPost(null);
      setToastMessage("Scheduled post cancelled.");
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setPosts((prev) => prev.filter((p) => p.id !== calendarPost.id));
      setSelectedPost(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleScheduleForDate = (date: Date, timeStr = "18:45") => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    router.push(`/dashboard/create?date=${yyyy}-${mm}-${dd}&time=${timeStr}`);
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

      {/* Page Header Row */}
      <div className="mb-space-lg flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Editorial Content Calendar
            </h1>
            <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary">
              {posts.length} Scheduled Drops
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Visual pacing, multi-channel release density, and click-to-edit schedule manager.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/create"
            className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-xs font-semibold text-on-primary-container shadow-[0_0_20px_-3px_rgba(255,76,131,0.3)] transition-all hover:brightness-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Compose Post</span>
          </Link>
        </div>
      </div>

      {/* Calendar Control Bar (Navigation & View Mode Selector) */}
      <div className="mb-space-md flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3 shadow-sm">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="rounded-lg bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Today (Sep 15)
          </button>

          <h2 className="ml-2 text-sm font-bold text-on-surface sm:text-base">
            {headerTitle}
          </h2>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-xl bg-surface-container p-1 shadow-inner">
          {(["MONTH", "WEEK", "DAY"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === mode
                  ? "bg-surface-container-high text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {mode === "MONTH" ? "Monthly" : mode === "WEEK" ? "Weekly" : "Daily"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calendar Content */}
      {loading ? (
        <div className="flex h-80 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-low">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ================================================================ */}
          {/* VIEW 1: MONTHLY CALENDAR GRID                                     */}
          {/* ================================================================ */}
          {viewMode === "MONTH" && (
            <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-[#131B2A] shadow-sm">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b border-outline-variant/20 bg-surface-container/60 text-center text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-2.5">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-outline-variant/20">
                {monthCells.map((cell, idx) => {
                  if (cell.dayNum === null) {
                    return (
                      <div
                        key={idx}
                        className="min-h-[125px] bg-black/20 p-2 text-xs opacity-20"
                      />
                    );
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => cell.fullDate && handleScheduleForDate(cell.fullDate)}
                      className={`group relative min-h-[125px] cursor-pointer p-2 transition-colors hover:bg-surface-container/40 ${
                        cell.isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            cell.isToday
                              ? "bg-primary text-white shadow-md shadow-primary/30"
                              : "text-on-surface"
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        <span className="material-symbols-outlined text-[15px] text-transparent transition-colors group-hover:text-primary">
                          add_circle
                        </span>
                      </div>

                      {/* Scheduled Post Pills on this day */}
                      <div className="mt-2 flex flex-col gap-1.5">
                        {cell.events.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPost(evt);
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-surface-container-high p-1 text-[10px] font-medium text-on-surface shadow-xs transition-transform hover:scale-[1.02] hover:border-primary/50"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={evt.thumbnailUrl}
                              alt="Event thumbnail"
                              className="h-5 w-5 shrink-0 rounded object-cover"
                            />
                            <div className="flex min-w-0 flex-1 flex-col leading-tight">
                              <span className="truncate font-semibold text-on-surface">
                                {evt.caption.slice(0, 24)}...
                              </span>
                              <span className="text-[9px] text-[#94A3B8]">
                                {evt.dateObj.toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                                {" • "}
                                <strong className="text-primary">{evt.mediaType}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW 2: WEEKLY PACING TIMELINE                                    */}
          {/* ================================================================ */}
          {viewMode === "WEEK" && (
            <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-[#131B2A] shadow-sm">
              <div className="grid grid-cols-1 divide-y divide-outline-variant/20 sm:grid-cols-7 sm:divide-x sm:divide-y-0">
                {weekDays.map((col, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col min-h-[480px] p-3 transition-colors ${
                      col.isToday ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Column Day Header */}
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                          {col.dayName}
                        </span>
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold mt-0.5 ${
                            col.isToday ? "bg-primary text-white" : "text-on-surface"
                          }`}
                        >
                          {col.dayNum}
                        </span>
                      </div>
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                        {col.events.length} Drops
                      </span>
                    </div>

                    {/* Events List in Week Column */}
                    <div className="mt-3 flex flex-1 flex-col gap-2">
                      {col.events.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedPost(evt)}
                          className="group cursor-pointer rounded-xl border border-outline-variant/30 bg-surface-container p-2.5 transition-all hover:border-primary hover:bg-surface-container-high shadow-xs"
                        >
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40 mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={evt.thumbnailUrl}
                              alt="Thumbnail"
                              className="h-full w-full object-cover "
                            />
                            <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                              {evt.mediaType}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs font-semibold text-on-surface leading-snug">
                            {evt.caption}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-on-surface-variant">
                            <span>
                              {evt.dateObj.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="font-semibold text-emerald-400">
                              {evt.status}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Add Slot Trigger */}
                      <button
                        type="button"
                        onClick={() => handleScheduleForDate(col.date)}
                        className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-outline-variant/40 py-2.5 text-xs font-medium text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary hover:bg-surface-container/50"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          add
                        </span>
                        <span>Schedule Drop</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW 3: DAILY HOURLY AGENDA BREAKDOWN                             */}
          {/* ================================================================ */}
          {viewMode === "DAY" && (
            <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-[#131B2A] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    view_day
                  </span>
                  <h3 className="text-sm font-bold text-on-surface">
                    Hourly Agenda for {headerTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleScheduleForDate(currentDate)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary-container"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add Post for Today</span>
                </button>
              </div>

              {/* Hour Rows */}
              <div className="flex flex-col divide-y divide-outline-variant/20">
                {dayHours.map((slot) => (
                  <div
                    key={slot.hour}
                    className="group flex flex-col gap-2 py-3 sm:flex-row sm:items-start"
                  >
                    {/* Time Label Column */}
                    <div className="w-24 shrink-0 font-bold text-xs text-on-surface-variant pt-1">
                      {slot.label}
                    </div>

                    {/* Content Column */}
                    <div className="flex flex-1 flex-col gap-2">
                      {slot.events.length > 0 ? (
                        slot.events.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedPost(evt)}
                            className="flex cursor-pointer flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-primary/30 bg-surface-container p-3 transition-all hover:bg-surface-container-high shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={evt.thumbnailUrl}
                                alt="Thumbnail"
                                className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                              />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-primary-container/20 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                                    {evt.mediaType}
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-semibold">
                                    {evt.status}
                                  </span>
                                  <span className="text-[10px] text-on-surface-variant">
                                    • {evt.timezone}
                                  </span>
                                </div>
                                <span className="font-semibold text-xs text-on-surface mt-0.5 line-clamp-1 max-w-lg">
                                  {evt.caption}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-lg bg-surface-container-high px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-surface-variant"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                edit
                              </span>
                              <span>View / Edit</span>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div
                          onClick={() =>
                            handleScheduleForDate(currentDate, slot.timeStr)
                          }
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-transparent p-2 text-xs text-on-surface-variant transition-all hover:border-outline-variant hover:bg-surface-container/30"
                        >
                          <span className="text-[11px] opacity-60">
                            Empty slot — available for publishing
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-transparent group-hover:text-primary transition-colors">
                            add
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================================================================== */}
      {/* CLICK-TO-EDIT / INSPECT POST MODAL                                   */}
      {/* ==================================================================== */}
      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPost(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-[#0e131f] text-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  event_upcoming
                </span>
                <span className="text-sm font-bold text-white">
                  Scheduled Post Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4 p-5">
              {/* Media Thumbnail & Meta Header */}
              <div className="flex gap-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPost.thumbnailUrl}
                    alt="Scheduled item"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[9px] font-bold uppercase text-white">
                    {selectedPost.aspectRatio || "1:1"}
                  </span>
                </div>

                <div className="flex flex-col justify-between py-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {selectedPost.mediaType}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 " />
                      <span>{selectedPost.status}</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 text-xs text-neutral-300">
                    <span className="font-semibold text-white flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">
                        schedule
                      </span>
                      <span>
                        {selectedPost.dateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at{" "}
                        {selectedPost.dateObj.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Target Timezone: {selectedPost.timezone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Caption Preview Block */}
              <div className="flex flex-col gap-1 rounded-xl bg-white/5 p-3.5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Post Caption &amp; Hashtags
                </span>
                <p className="text-xs leading-relaxed text-neutral-200 whitespace-pre-line">
                  {selectedPost.caption}
                </p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/40 px-5 py-3.5">
              <button
                type="button"
                disabled={actionLoadingId === selectedPost.id}
                onClick={() => handleCancelPost(selectedPost)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  delete
                </span>
                <span>Cancel Post</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard/create?date=${selectedPost.dateObj.toISOString().split("T")[0]}`
                    )
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    edit
                  </span>
                  <span>Edit in Studio</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoadingId === selectedPost.id}
                  onClick={() => handlePublishNow(selectedPost)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-bold text-on-primary-container shadow-md transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {actionLoadingId === selectedPost.id ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">
                      rocket_launch
                    </span>
                  )}
                  <span>Publish Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
