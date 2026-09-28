"use client";

import React, { useMemo } from "react";
import { validateScheduleTime } from "@/lib/errors";

export type ScheduleStrategy = "SCHEDULE" | "NOW" | "DRAFT";

interface ScheduleControlsProps {
  strategy: ScheduleStrategy;
  onSelectStrategy: (strat: ScheduleStrategy) => void;
  publishDate: string;
  onChangePublishDate: (date: string) => void;
  publishTime: string;
  onChangePublishTime: (time: string) => void;
  timezone?: string;
  onChangeTimezone?: (timezone: string) => void;
  onDiscard?: () => void;
  onSaveDraft?: () => void;
  onSchedulePost?: () => void;
  isSubmitting?: boolean;
}

const timezones = [
  { id: "PST (UTC-8)", label: "PST (UTC-8) - Pacific Time" },
  { id: "EST (UTC-5)", label: "EST (UTC-5) - Eastern Time" },
  { id: "UTC (UTC+0)", label: "UTC (UTC+0) - Coordinated Universal" },
  { id: "GMT (UTC+0)", label: "GMT (UTC+0) - London / UK" },
  { id: "CET (UTC+1)", label: "CET (UTC+1) - Paris, Berlin" },
  { id: "IST (UTC+5:30)", label: "IST (UTC+5:30) - India Standard Time" },
  { id: "JST (UTC+9)", label: "JST (UTC+9) - Tokyo / Japan" },
  { id: "AEST (UTC+10)", label: "AEST (UTC+10) - Sydney / Australia" },
];

export default function ScheduleControls({
  strategy,
  onSelectStrategy,
  publishDate,
  onChangePublishDate,
  publishTime,
  onChangePublishTime,
  timezone = "PST (UTC-8)",
  onChangeTimezone,
  onDiscard,
  onSaveDraft,
  onSchedulePost,
  isSubmitting = false,
}: ScheduleControlsProps) {
  const strategies: {
    id: ScheduleStrategy;
    title: string;
    description: string;
    icon: string;
  }[] = [
    {
      id: "SCHEDULE",
      title: "Schedule Later",
      description: "Queue for automated publishing",
      icon: "schedule",
    },
    {
      id: "NOW",
      title: "Publish Now",
      description: "Direct push live to Instagram",
      icon: "rocket_launch",
    },
    {
      id: "DRAFT",
      title: "Save Draft",
      description: "Staged internally for review",
      icon: "draft",
    },
  ];

  const scheduleValidation = useMemo(() => {
    if (strategy !== "SCHEDULE") return { valid: true };
    return validateScheduleTime(publishDate, publishTime);
  }, [strategy, publishDate, publishTime]);

  const applyRecommendedSlot = (daysAhead: number, timeStr: string) => {
    const target = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    onChangePublishDate(`${yyyy}-${mm}-${dd}`);
    onChangePublishTime(timeStr);
    onSelectStrategy("SCHEDULE");
  };

  const setQuickFutureSlot = (minsFromNow: number) => {
    const target = new Date(Date.now() + minsFromNow * 60 * 1000);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    const hh = String(target.getHours()).padStart(2, "0");
    const min = String(target.getMinutes()).padStart(2, "0");
    onChangePublishDate(`${yyyy}-${mm}-${dd}`);
    onChangePublishTime(`${hh}:${min}`);
  };

  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm border border-outline-variant/20">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            calendar_clock
          </span>
          <h2 className="text-sm font-semibold text-on-surface">
            Publishing Schedule &amp; Execution Strategy
          </h2>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          <span>AI Audience Peak: +24% Retention</span>
        </div>
      </div>

      {/* Strategy Toggle Cards */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {strategies.map((strat) => {
          const isSelected = strategy === strat.id;
          return (
            <label
              key={strat.id}
              onClick={() => onSelectStrategy(strat.id)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-space-md transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(124,58,237,0.15)] ring-1 ring-primary"
                  : "border-outline-variant/20 bg-surface-container hover:bg-surface-container-high"
              }`}
            >
              <input
                type="radio"
                name="publishing_strategy"
                value={strat.id}
                checked={isSelected}
                onChange={() => onSelectStrategy(strat.id)}
                className="mt-1 accent-primary"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-[15px] text-primary">
                    {strat.icon}
                  </span>
                  <span>{strat.title}</span>
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  {strat.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {/* Date, Time & Timezone Pickers (Visible in SCHEDULE mode) */}
      {strategy === "SCHEDULE" && (
        <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/20">
          {/* AI Optimal Slot Pills */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">
                auto_awesome
              </span>
              <span>Recommended High-Velocity Time Slots:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyRecommendedSlot(1, "18:45")}
                className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface hover:bg-surface-container-high hover:text-primary transition-colors"
              >
                <span>Tomorrow 6:45 PM</span>
                <span className="rounded bg-secondary/15 px-1 py-0.2 text-[9px] font-bold text-secondary">
                  +24% Reach
                </span>
              </button>
              <button
                type="button"
                onClick={() => applyRecommendedSlot(2, "12:30")}
                className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface hover:bg-surface-container-high hover:text-primary transition-colors"
              >
                <span>In 2 Days 12:30 PM</span>
                <span className="rounded bg-secondary/15 px-1 py-0.2 text-[9px] font-bold text-secondary">
                  +18% Reach
                </span>
              </button>
              <button
                type="button"
                onClick={() => applyRecommendedSlot(3, "20:00")}
                className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface hover:bg-surface-container-high hover:text-primary transition-colors"
              >
                <span>In 3 Days 8:00 PM</span>
                <span className="rounded bg-secondary/15 px-1 py-0.2 text-[9px] font-bold text-secondary">
                  +31% Reach
                </span>
              </button>
            </div>
          </div>

          {/* Input Pickers Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1 border-t border-surface-container-low">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">
                  calendar_today
                </span>
                <span>Publish Date</span>
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => onChangePublishDate(e.target.value)}
                className={`h-10 w-full rounded-lg bg-surface-container px-3 text-xs text-on-surface [color-scheme:dark] focus:outline-none focus:ring-1 border transition-colors ${
                  !scheduleValidation.valid
                    ? "border-amber-500/50 focus:ring-amber-500"
                    : "border-outline-variant/20 focus:ring-primary"
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">
                  schedule
                </span>
                <span>Publish Time</span>
              </label>
              <input
                type="time"
                value={publishTime}
                onChange={(e) => onChangePublishTime(e.target.value)}
                className={`h-10 w-full rounded-lg bg-surface-container px-3 text-xs text-on-surface [color-scheme:dark] focus:outline-none focus:ring-1 border transition-colors ${
                  !scheduleValidation.valid
                    ? "border-amber-500/50 focus:ring-amber-500"
                    : "border-outline-variant/20 focus:ring-primary"
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">
                  public
                </span>
                <span>Timezone</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => onChangeTimezone && onChangeTimezone(e.target.value)}
                className="h-10 w-full rounded-lg bg-surface-container px-3 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/20"
              >
                {timezones.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation Feedback & Quick Fix Banner */}
          {!scheduleValidation.valid && scheduleValidation.error ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0">
                  warning
                </span>
                <span className="leading-snug">{scheduleValidation.error.message}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuickFutureSlot(30)}
                  className="rounded bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors"
                >
                  +30 Mins
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFutureSlot(60)}
                  className="rounded bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => applyRecommendedSlot(1, "10:00")}
                  className="rounded bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors"
                >
                  Tomorrow 10 AM
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant bg-surface-container/60 rounded-lg px-3 py-1.5">
              <span className="material-symbols-outlined text-[15px] text-emerald-400">
                check_circle
              </span>
              <span>
                Post will queue automatically for execution on{" "}
                <strong className="text-on-surface">{publishDate}</strong> at{" "}
                <strong className="text-on-surface">{publishTime}</strong> ({timezone}).
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Strip */}
      <div className="flex flex-col items-center justify-between gap-space-md pt-space-xs sm:flex-row">
        <button
          type="button"
          onClick={onDiscard}
          className="w-full rounded-xl bg-surface-container-high px-space-md py-2.5 text-center text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface sm:w-auto"
        >
          Discard Changes
        </button>

        <div className="flex w-full items-center justify-end gap-space-sm sm:w-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex-1 rounded-xl bg-surface-container-high px-space-md py-2.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-variant sm:flex-initial"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={onSchedulePost}
            disabled={isSubmitting || (strategy === "SCHEDULE" && !scheduleValidation.valid)}
            className="flex flex-1 items-center justify-center gap-2 rounded bg-[#FF4D36] hover:bg-[#E63A23] px-space-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 sm:flex-initial"
          >
            <span className="material-symbols-outlined text-[20px]">
              {strategy === "NOW"
                ? "send"
                : strategy === "DRAFT"
                ? "bookmark"
                : "schedule_send"}
            </span>
            <span>
              {isSubmitting
                ? "Processing..."
                : strategy === "NOW"
                ? "Publish Now to Instagram"
                : strategy === "DRAFT"
                ? "Save Draft"
                : strategy === "SCHEDULE" && !scheduleValidation.valid
                ? "Fix Schedule Time"
                : `Schedule for ${publishDate || "Tomorrow"}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
