"use client";

import React, { useState } from "react";
import { MediaUploadItem as MediaItem } from "./ContentUpload";

export type PreviewPerspective = "FEED" | "CARD" | "GRID" | "STORY";

interface FeedSimulatorProps {
  mediaList: MediaItem[];
  activeSlide?: number;
  caption: string;
  firstComment: string;
  location?: string;
  accountHandle?: string;
  scheduledDateLabel?: string;
}

export default function FeedSimulator({
  mediaList,
  activeSlide = 0,
  caption,
  firstComment,
  location = "Los Angeles, California",
  accountHandle = "luminous.studio",
  scheduledDateLabel = "Scheduled for Tomorrow • 6:45 PM",
}: FeedSimulatorProps) {
  const [perspective, setPerspective] = useState<PreviewPerspective>("FEED");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(activeSlide);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [simulatedComment, setSimulatedComment] = useState("");
  const [simulatedCommentsList, setSimulatedCommentsList] = useState<string[]>([]);

  const activeMedia =
    mediaList[currentSlideIndex] ||
    mediaList[0] || {
      id: "fallback",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      alt: "Post Preview",
      order: 0,
      fileType: "IMAGE" as const,
    };

  const formatCaption = (text: string) => {
    if (!text.trim()) {
      return (
        <span className="italic text-neutral-500">
          Your caption will appear here in real time...
        </span>
      );
    }

    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_.]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span key={index} className="cursor-pointer text-[#8ec5ff] hover:underline">
            {part}
          </span>
        );
      }
      if (part.startsWith("@")) {
        return (
          <span key={index} className="cursor-pointer text-[#8ec5ff] font-semibold hover:underline">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < mediaList.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleAddSimulatedComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (simulatedComment.trim()) {
      setSimulatedCommentsList((prev) => [...prev, simulatedComment.trim()]);
      setSimulatedComment("");
    }
  };

  return (
    <aside className="flex flex-col items-center gap-space-md xl:sticky xl:top-20 w-full max-w-[440px]">
      {/* Live Preview Header & Perspective Switcher */}
      <div className="flex w-full items-center justify-between px-space-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            visibility
          </span>
          <span className="text-xs font-semibold text-on-surface">
            Interactive Preview
          </span>
        </div>

        <div className="flex items-center rounded-lg bg-surface-container-low p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setPerspective("FEED")}
            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
              perspective === "FEED"
                ? "bg-surface-container text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Phone
          </button>
          <button
            type="button"
            onClick={() => setPerspective("CARD")}
            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
              perspective === "CARD"
                ? "bg-surface-container text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Post Card
          </button>
          <button
            type="button"
            onClick={() => setPerspective("GRID")}
            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
              perspective === "GRID"
                ? "bg-surface-container text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            9-Grid
          </button>
          <button
            type="button"
            onClick={() => setPerspective("STORY")}
            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
              perspective === "STORY"
                ? "bg-surface-container text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Story
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PERSPECTIVE 1: DEDICATED POST PREVIEW CARD (DESKTOP / FEED CARD)     */}
      {/* ==================================================================== */}
      {perspective === "CARD" && (
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-[#0d1017] text-white shadow-2xl transition-all">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#F56040] via-[#E1306C] to-[#C13584] p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                  L
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white">{accountHandle}</span>
                  <span
                    className="material-symbols-outlined text-[14px] text-[#0095F6]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  <span className="text-[10px] text-white/50">• 1h</span>
                </div>
                <span className="text-[11px] text-white/60">{location}</span>
              </div>
            </div>
            <button
              type="button"
              className="text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>

          {/* Media Carousel Container */}
          <div className="relative aspect-square w-full select-none overflow-hidden bg-black">
            {activeMedia.fileType === "VIDEO" ? (
              <video
                src={activeMedia.url}
                className="h-full w-full object-cover"
                controls
                playsInline
                muted
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeMedia.url}
                alt={activeMedia.alt || "Post Media"}
                className="h-full w-full object-cover"
              />
            )}

            {/* Slide Navigation Arrows */}
            {mediaList.length > 1 && (
              <>
                {currentSlideIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/90 "
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                )}
                {currentSlideIndex < mediaList.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/90 "
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                )}
                {/* Carousel Index Badge */}
                <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white/95 backdrop-blur-md">
                  {currentSlideIndex + 1}/{mediaList.length}
                </div>

                {/* Carousel Slide Dots */}
                <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
                  {mediaList.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentSlideIndex
                          ? "w-4 bg-[#0095F6]"
                          : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className="transition-transform active:scale-125"
              >
                <span
                  className={`material-symbols-outlined text-[26px] transition-colors ${
                    isLiked ? "text-[#FF3040]" : "text-white hover:text-white/80"
                  }`}
                  style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
              </button>
              <button
                type="button"
                className="text-white hover:text-white/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
              </button>
              <button
                type="button"
                className="text-white hover:text-white/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">send</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className="text-white hover:text-white/80 transition-colors"
            >
              <span
                className={`material-symbols-outlined text-[24px] ${
                  isSaved ? "text-amber-400" : "text-white"
                }`}
                style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>
          </div>

          {/* Social Stats */}
          <div className="px-4 text-xs font-bold text-white">
            {(1428 + (isLiked ? 1 : 0)).toLocaleString()} likes
          </div>

          {/* Caption Section with Expand Toggle */}
          <div className="px-4 py-2 text-xs leading-relaxed text-neutral-200">
            <span className="font-bold text-white mr-1.5">{accountHandle}</span>
            {isCaptionExpanded ? (
              <span className="whitespace-pre-line">{formatCaption(caption)}</span>
            ) : (
              <span>
                {formatCaption(caption.slice(0, 120))}
                {caption.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setIsCaptionExpanded(true)}
                    className="ml-1 text-white/50 hover:text-white text-xs font-medium"
                  >
                    ...more
                  </button>
                )}
              </span>
            )}
          </div>

          {/* Pinned First Comment Preview */}
          {firstComment.trim() && (
            <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl bg-white/5 p-2.5 text-xs">
              <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0 mt-0.5">
                push_pin
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-[11px]">{accountHandle}</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] text-white/60">
                    Pinned Comment
                  </span>
                </div>
                <span className="text-neutral-300 mt-0.5">{firstComment}</span>
              </div>
            </div>
          )}

          {/* Simulated Comments List */}
          {simulatedCommentsList.map((c, i) => (
            <div key={i} className="px-4 py-1 text-xs text-neutral-300">
              <span className="font-bold text-white mr-1.5">{accountHandle}</span>
              <span>{c}</span>
            </div>
          ))}

          {/* Post Timestamp & Schedule Badge */}
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-white/50">
            <span>2 HOURS AGO</span>
            <span className="text-primary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              <span>{scheduledDateLabel}</span>
            </span>
          </div>

          {/* Comment Input Strip */}
          <form
            onSubmit={handleAddSimulatedComment}
            className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5 bg-black/40"
          >
            <span className="text-base cursor-pointer">😊</span>
            <input
              type="text"
              value={simulatedComment}
              onChange={(e) => setSimulatedComment(e.target.value)}
              placeholder={`Add a comment as ${accountHandle}...`}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!simulatedComment.trim()}
              className="text-xs font-bold text-[#0095F6] disabled:opacity-40 hover:underline"
            >
              Post
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PERSPECTIVE 2 & 4: SMARTPHONE FRAME (FEED OR STORY)                 */}
      {/* ==================================================================== */}
      {(perspective === "FEED" || perspective === "STORY") && (
        <div className="relative w-full max-w-[400px] rounded-[44px] bg-[#0a0d14] p-3.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] border border-outline-variant/20">
          {/* Screen Container */}
          <div className="relative flex w-full flex-col overflow-hidden rounded-[34px] bg-black text-[#F1F5F9]">
            {/* Status Bar */}
            <div className="flex h-10 select-none items-center justify-between bg-black px-6 pt-2 text-xs text-white/90">
              <span className="text-[11px] font-semibold">9:41</span>
              <div className="mx-auto h-4 w-20 rounded-full bg-[#16181f]" />
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="material-symbols-outlined text-[14px]">
                  signal_cellular_4_bar
                </span>
                <span className="material-symbols-outlined text-[14px]">
                  wifi
                </span>
                <span className="material-symbols-outlined text-[14px]">
                  battery_full
                </span>
              </div>
            </div>

            {perspective === "STORY" ? (
              /* Story Mode Preview */
              <div className="relative flex aspect-[9/16] w-full select-none flex-col justify-between overflow-hidden bg-[#12141c] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeMedia.url}
                  alt={activeMedia.alt || "Story asset"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

                {/* Story Top Bar */}
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/30">
                    <div className="h-full w-2/3 bg-white" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full border border-white/60 bg-gradient-to-tr from-[#F56040] via-[#E1306C] to-[#C13584] p-0.5">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[10px] font-bold">
                          L
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {accountHandle}
                      </span>
                      <span className="text-[10px] text-white/70">1h</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-white">
                      close
                    </span>
                  </div>
                </div>

                {/* Story Bottom Bar */}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex-1 rounded-full border border-white/40 bg-black/40 px-4 py-2 text-xs text-white/80 backdrop-blur-md">
                    Send message...
                  </div>
                  <span className="material-symbols-outlined text-[24px] text-white">
                    favorite
                  </span>
                  <span className="material-symbols-outlined text-[24px] text-white">
                    send
                  </span>
                </div>
              </div>
            ) : (
              /* Feed Mode Preview */
              <>
                {/* Instagram App Top Nav */}
                <div className="flex items-center justify-between bg-black px-4 py-2.5">
                  <span className="material-symbols-outlined text-[24px]">
                    arrow_back
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      Posts
                    </span>
                    <span className="text-[13px] font-bold tracking-tight">
                      {accountHandle}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[22px]">
                    notifications
                  </span>
                </div>

                {/* Profile Context Bar */}
                <div className="flex items-center justify-between px-3.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#F56040] via-[#E1306C] to-[#C13584] p-[1.5px]">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                        L
                      </div>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-bold">
                          {accountHandle}
                        </span>
                        <span
                          className="material-symbols-outlined text-[14px] text-[#0095F6]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {location}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined cursor-pointer text-[20px] text-neutral-400">
                    more_horiz
                  </span>
                </div>

                {/* Main Media Carousel Simulation */}
                <div className="relative aspect-square w-full select-none overflow-hidden bg-[#12141c]">
                  {activeMedia.fileType === "VIDEO" ? (
                    <video
                      src={activeMedia.url}
                      className="h-full w-full object-cover"
                      playsInline
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeMedia.url}
                      alt={activeMedia.alt || "Post asset"}
                      className="h-full w-full object-cover"
                    />
                  )}

                  {/* Carousel Indicator Chip */}
                  {mediaList.length > 1 && (
                    <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-md">
                      {currentSlideIndex + 1}/{mediaList.length}
                    </div>
                  )}

                  {/* Carousel Icon Accent */}
                  {mediaList.length > 1 && (
                    <div className="absolute left-3 top-3 rounded-md bg-black/60 p-1 text-white/90 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[14px]">
                        view_carousel
                      </span>
                    </div>
                  )}

                  {/* Interactive Carousel Dots */}
                  {mediaList.length > 1 && (
                    <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
                      {mediaList.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentSlideIndex
                              ? "w-3 bg-[#0095F6]"
                              : "w-1.5 bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Social Engagement Action Icons */}
                <div className="flex items-center justify-between px-3.5 pt-3">
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => setIsLiked(!isLiked)}
                      className="transition-colors hover:text-red-500"
                    >
                      <span
                        className={`material-symbols-outlined text-[26px] ${
                          isLiked ? "text-red-500" : "text-white"
                        }`}
                        style={{
                          fontVariationSettings: isLiked
                            ? "'FILL' 1"
                            : "'FILL' 0",
                        }}
                      >
                        favorite
                      </span>
                    </button>
                    <button
                      type="button"
                      className="text-white transition-colors hover:text-neutral-300"
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        mode_comment
                      </span>
                    </button>
                    <button
                      type="button"
                      className="text-white transition-colors hover:text-neutral-300"
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        send
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSaved(!isSaved)}
                    className="text-white transition-colors hover:text-neutral-300"
                  >
                    <span
                      className={`material-symbols-outlined text-[24px] ${
                        isSaved ? "text-amber-400" : "text-white"
                      }`}
                      style={{
                        fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      bookmark
                    </span>
                  </button>
                </div>

                {/* Social Metrics (Likes) */}
                <div className="px-3.5 pt-2 text-[13px] font-semibold">
                  Liked by <span className="font-bold">alex_design</span> and{" "}
                  <span className="font-bold">
                    {isLiked ? "1,421 others" : "1,420 others"}
                  </span>
                </div>

                {/* Dynamic Live Caption Preview */}
                <div className="px-3.5 pb-3 pt-1 text-[13px] leading-[18px]">
                  <span className="mr-1.5 font-bold">{accountHandle}</span>
                  <span className="text-neutral-200">
                    {formatCaption(caption)}
                  </span>
                </div>

                {/* Comments Snippet Preview */}
                <div className="px-3.5 pb-2 text-[12px] text-neutral-400">
                  View all 48 comments
                </div>

                {/* First Comment Preview Pill */}
                {firstComment.trim() && (
                  <div className="mx-3.5 mb-3 flex items-start gap-2 rounded-lg bg-[#141722] p-2 text-[12px]">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-container text-[8px] font-bold text-black">
                      L
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-neutral-300">
                        {accountHandle}{" "}
                        <span className="ml-1 font-normal text-neutral-500">
                          pinned
                        </span>
                      </span>
                      <span className="leading-tight text-neutral-300">
                        {firstComment}
                      </span>
                    </div>
                  </div>
                )}

                {/* Scheduled Timestamp */}
                <div className="px-3.5 pb-4 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  {scheduledDateLabel}
                </div>
              </>
            )}

            {/* Home Bar Indicator */}
            <div className="flex h-4 items-center justify-center bg-black pb-1.5">
              <div className="h-1 w-32 rounded-full bg-neutral-700" />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PERSPECTIVE 3: 9-GRID HARMONY PERSPECTIVE                           */}
      {/* ==================================================================== */}
      {perspective === "GRID" && (
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-space-md shadow-xl">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary">
                grid_on
              </span>
              <span>Profile 9-Grid Harmony Studio</span>
            </span>
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold text-secondary">
              Aesthetic Fit: 99.2%
            </span>
          </div>

          {/* 9-Grid Preview Layout */}
          <div className="grid grid-cols-3 gap-1.5 overflow-hidden rounded-xl bg-black p-1.5">
            {/* Scheduled Top Left New Post */}
            <div className="relative aspect-square overflow-hidden rounded-lg ring-2 ring-primary shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeMedia.url}
                alt="Scheduled post"
                className="h-full w-full object-cover"
              />
              <div className="absolute left-1 top-1 rounded bg-primary px-1 py-0.2 text-[8px] font-bold text-white">
                NEW
              </div>
            </div>

            {/* Simulated Existing Profile Posts */}
            {[
              "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80",
              "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=300&q=80",
            ].map((imgUrl, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-lg bg-surface-container-high opacity-85 hover:opacity-100 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`Existing grid post ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Palette: High-contrast Neon &amp; Glass</span>
            <span className="font-semibold text-primary">Balanced Contrast</span>
          </div>
        </div>
      )}

      {/* Mini Profile Harmony Indicator (always shown when not in full grid view) */}
      {perspective !== "GRID" && (
        <div className="flex w-full flex-col gap-2 rounded-xl bg-surface-container-low p-space-sm shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-primary">
                grid_on
              </span>
              <span>Profile Grid Balance</span>
            </span>
            <span className="text-[11px] font-semibold text-secondary">
              Aesthetic Fit: 99.2%
            </span>
          </div>

          {/* Micro Grid Mini-Feed Preview */}
          <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-lg bg-surface-container-lowest p-1">
            <div className="relative aspect-square overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeMedia.url}
                alt="Scheduled post"
                className="h-full w-full object-cover"
              />
              <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary shadow-sm" />
            </div>

            <div className="aspect-square overflow-hidden rounded bg-surface-container-high opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80"
                alt="Past post 1"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="aspect-square overflow-hidden rounded bg-surface-container-high opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80"
                alt="Past post 2"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <span className="text-center text-[10px] text-on-surface-variant">
            Harmonizes with existing @{accountHandle} theme
          </span>
        </div>
      )}
    </aside>
  );
}
