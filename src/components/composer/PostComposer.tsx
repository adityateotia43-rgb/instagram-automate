"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatApiError, validateScheduleTime } from "@/lib/errors";
import FormatSelector, { PostFormat } from "./FormatSelector";
import ContentUpload, { MediaUploadItem } from "./ContentUpload";
import { AspectRatio } from "./ResizeControls";
import CaptionEditor from "./CaptionEditor";
import PublishingOptions from "./PublishingOptions";
import ScheduleControls, { ScheduleStrategy } from "./ScheduleControls";
import FeedSimulator from "./FeedSimulator";
import { useToast } from "@/components/providers/ToastProvider";

const sampleMedia: MediaUploadItem[] = [
  {
    id: "media-1",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    alt: "Futuristic neon architectural photography",
    dimensions: "2160 × 2160",
    order: 0,
    fileType: "IMAGE",
    formattedSize: "3.4 MB",
  },
  {
    id: "media-2",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
    alt: "Minimalist holographic glass render",
    dimensions: "2160 × 2160",
    order: 1,
    fileType: "IMAGE",
    formattedSize: "4.8 MB",
  },
];

export default function PostComposer() {
  const router = useRouter();
  const { toast } = useToast();
  const lastPublishedRef = useRef<{ signature: string; timestamp: number } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<PostFormat>("FEED");
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("1:1");
  const [mediaList, setMediaList] = useState<MediaUploadItem[]>(sampleMedia);
  const [caption, setCaption] = useState(
    "Precision meets pure aesthetic momentum. ✨\nIntroducing Horizon Drop 04 — engineered for creator teams redefining the visual velocity of modern digital culture. Every detail calibrated for impact.\n\nLink in bio to secure early access to the limited design system kit before global launch. 🚀\n\n#designinspo #creativedirector #saasbranding #socialmediatips"
  );
  const [firstComment, setFirstComment] = useState(
    "Drop a 🔥 if you want a DM invite to tomorrow's backstage breakdown!"
  );
  const [autoPlaceHashtags, setAutoPlaceHashtags] = useState(true);
  const [taggedHandles, setTaggedHandles] = useState("");
  const [location, setLocation] = useState("Los Angeles, California");
  const [shareToFacebook, setShareToFacebook] = useState(true);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [disableComments, setDisableComments] = useState(false);

  const [strategy, setStrategy] = useState<ScheduleStrategy>("SCHEDULE");
  const [publishDate, setPublishDate] = useState<string>(() => {
    const t = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return t.toISOString().split("T")[0];
  });
  const [publishTime, setPublishTime] = useState("18:45");
  const [timezone, setTimezone] = useState("PST (UTC-8)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "info" | "error";
    message: string;
    actionLabel?: string;
    actionUrl?: string;
  } | null>(null);

  // Read URL query parameters from Calendar navigation, imported assets from Media Library, and saved preferences
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlDate = params.get("date");
      const urlTime = params.get("time");
      if (urlDate) {
        setPublishDate(urlDate);
        setStrategy("SCHEDULE");
      }
      if (urlTime) {
        setPublishTime(urlTime);
      }

      const importedDraftRaw = sessionStorage.getItem("composer_import_draft");
      if (importedDraftRaw) {
        try {
          const draft = JSON.parse(importedDraftRaw);
          if (draft && draft.caption) {
            setCaption(draft.caption);
            if (draft.thumbnailUrl) {
              setMediaList([
                {
                  id: `media_draft_${Date.now()}`,
                  url: draft.thumbnailUrl,
                  alt: draft.title || "Draft media",
                  dimensions: draft.aspectRatio === "16:9" ? "1920 × 1080" : "2160 × 2160",
                  order: 0,
                  fileType: draft.mediaType === "REEL" || draft.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
                  formattedSize: "3.2 MB",
                },
              ]);
            }
            if (draft.mediaType === "REEL") {
              setSelectedFormat("REEL");
            } else if (draft.mediaType === "CAROUSEL") {
              setSelectedFormat("FEED");
            }
            if (draft.aspectRatio && (draft.aspectRatio === "1:1" || draft.aspectRatio === "4:5" || draft.aspectRatio === "16:9")) {
              setSelectedRatio(draft.aspectRatio);
            }
            setStrategy("DRAFT");
            setNotification({
              type: "info",
              message: `Restored concept "${draft.title || "Draft"}" into Creator Studio!`,
            });
            toast.info(`Restored concept "${draft.title || "Draft"}" into Creator Studio!`, "Draft Staging");
          }
          sessionStorage.removeItem("composer_import_draft");
        } catch {
          // Ignore parse errors
        }
      } else {
        const savedSettingsRaw = localStorage.getItem("instaflow_user_settings");
        if (savedSettingsRaw) {
          try {
            const s = JSON.parse(savedSettingsRaw);
            if (s.defaultRatio && (s.defaultRatio === "1:1" || s.defaultRatio === "4:5" || s.defaultRatio === "16:9")) {
              setSelectedRatio(s.defaultRatio);
            }
            if (s.defaultTimezone) setTimezone(s.defaultTimezone);
            if (s.firstCommentTemplate) setFirstComment(s.firstCommentTemplate);
            if (typeof s.autoHashtagsInComment === "boolean") setAutoPlaceHashtags(s.autoHashtagsInComment);
            if (typeof s.shareToFacebook === "boolean") setShareToFacebook(s.shareToFacebook);
            if (typeof s.hideLikeCount === "boolean") setHideLikeCount(s.hideLikeCount);
            if (typeof s.disableComments === "boolean") setDisableComments(s.disableComments);
          } catch {
            // Ignore parse errors
          }
        }
      }

      const importedMediaRaw = sessionStorage.getItem("composer_import_media");
      if (importedMediaRaw) {
        try {
          const parsed = JSON.parse(importedMediaRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMediaList(parsed);
            if (parsed.length > 1) {
              setSelectedFormat("FEED"); // Carousel
            } else if (parsed[0].fileType === "VIDEO" && parsed[0].dimensions?.includes("1920")) {
              setSelectedFormat("REEL");
            }
            if (parsed[0].aspectRatio) {
              const r = parsed[0].aspectRatio;
              if (r === "1:1" || r === "4:5" || r === "16:9") {
                setSelectedRatio(r);
              }
            }
            setNotification({
              type: "info",
              message: `Loaded ${parsed.length} asset(s) from Media Library into Studio!`,
            });
            toast.info(`Loaded ${parsed.length} asset(s) from Media Library!`, "Media Assets");
          }
          sessionStorage.removeItem("composer_import_media");
        } catch {
          // Ignore JSON parse errors
        }
      }
    }
  }, [toast]);

  const handleSchedulePost = async () => {
    if (!mediaList || mediaList.length === 0) {
      const msg = "Please add at least one photo or video before publishing or scheduling.";
      setNotification({
        type: "error",
        message: msg,
      });
      toast.warning(msg, "Media Asset Required");
      return;
    }

    if (strategy === "SCHEDULE") {
      const scheduleCheck = validateScheduleTime(publishDate, publishTime);
      if (!scheduleCheck.valid && scheduleCheck.error) {
        setNotification({
          type: "error",
          message: scheduleCheck.error.message,
          actionLabel: scheduleCheck.error.actionLabel,
        });
        toast.warning(scheduleCheck.error.message, scheduleCheck.error.title);
        return;
      }
    }

    const postSignature = `${mediaList.map((m) => m.url).sort().join("|")}::${caption.trim().toLowerCase()}`;
    const now = Date.now();
    if (strategy === "NOW" && lastPublishedRef.current && lastPublishedRef.current.signature === postSignature) {
      const elapsedSec = Math.max(1, Math.round((now - lastPublishedRef.current.timestamp) / 1000));
      if (elapsedSec < 90) {
        const proceed = window.confirm(
          `You published this exact post ${elapsedSec}s ago. Publishing again will post a duplicate to your Instagram feed.\n\nDo you want to proceed anyway?`
        );
        if (!proceed) return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        strategy,
        format: selectedFormat,
        aspectRatio: selectedRatio,
        mediaItems: mediaList.map((m, idx) => ({
          id: m.id,
          url: m.url,
          alt: m.alt,
          order: idx,
        })),
        caption,
        firstComment,
        autoPlaceHashtags,
        taggedHandles,
        location,
        shareToFacebook,
        hideLikeCount,
        disableComments,
        publishDate,
        publishTime,
        timezone,
      };

      const publishPostApiResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let publishPostPayload;
      try {
        publishPostPayload = await publishPostApiResponse.json();
      } catch {
        publishPostPayload = { error: "Network communication error. Server did not return a valid response." };
      }

      if (publishPostApiResponse.ok && publishPostPayload.success) {
        if (strategy === "NOW") {
          lastPublishedRef.current = { signature: postSignature, timestamp: Date.now() };
        }
        setNotification({
          type: "success",
          message: publishPostPayload.message || "Action completed successfully!",
        });
        toast.success(publishPostPayload.message || "Action completed successfully!", "Studio Orchestrator");
      } else {
        const userFacing = formatApiError(publishPostPayload.error || publishPostPayload);
        setNotification({
          type: "error",
          message: userFacing.message,
          actionLabel: userFacing.actionLabel,
          actionUrl: userFacing.actionUrl,
        });
        toast.error(
          userFacing.message,
          userFacing.title,
          userFacing.actionUrl
            ? {
                label: userFacing.actionLabel || "View",
                onClick: () => router.push(userFacing.actionUrl!),
              }
            : undefined
        );
      }
    } catch (err: unknown) {
      const userFacing = formatApiError(err);
      setNotification({
        type: "error",
        message: userFacing.message,
        actionLabel: userFacing.actionLabel,
        actionUrl: userFacing.actionUrl,
      });
      toast.error(userFacing.message, userFacing.title);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 8000);
    }
  };

  const handleDiscard = () => {
    if (confirm("Are you sure you want to discard your changes?")) {
      setCaption("");
      setFirstComment("");
      setMediaList(sampleMedia);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1680px] px-space-md py-space-md lg:px-space-xl">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border p-3.5 text-xs font-semibold shadow-lg ${
            notification.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : notification.type === "info"
              ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {notification.type === "error"
                ? "error"
                : notification.type === "info"
                ? "info"
                : "check_circle"}
            </span>
            <span>{notification.message}</span>
            {notification.actionLabel && notification.actionUrl && (
              <button
                type="button"
                onClick={() => router.push(notification.actionUrl!)}
                className="ml-2 font-bold underline underline-offset-2 hover:opacity-80 transition-opacity text-primary"
              >
                {notification.actionLabel} &rarr;
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="self-end sm:self-auto text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Action / Context Row */}
      <div className="mb-space-lg flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-space-sm">
          <div className="h-2.5 w-2.5 rounded-full bg-primary-container shadow-[0_0_12px_rgba(255,76,131,0.8)]" />
          <h1 className="text-xl font-bold tracking-tight text-on-surface sm:text-2xl">
            Create Post
          </h1>
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
            Campaign: Horizon Drop 04
          </span>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3.5 py-1.5 text-xs font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined text-[18px]">
              history
            </span>
            <span>Version History</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert("Preview link copied to clipboard!");
            }}
            className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3.5 py-1.5 text-xs font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-variant"
          >
            <span className="material-symbols-outlined text-[18px]">
              visibility
            </span>
            <span>Share Preview Link</span>
          </button>
        </div>
      </div>

      {/* Main Split-Screen Studio Grid */}
      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        {/* LEFT PANEL: 60% EDITOR */}
        <section className="flex flex-col gap-space-lg xl:col-span-7">
          {/* Post Format Selector Tabs */}
          <FormatSelector
            selectedFormat={selectedFormat}
            onSelectFormat={setSelectedFormat}
          />

          {/* Media Upload & Sorting Deck */}
          <ContentUpload
            mediaList={mediaList}
            onMediaChange={setMediaList}
            selectedRatio={selectedRatio}
            onSelectRatio={setSelectedRatio}
            isDemoMode={true}
          />

          {/* Caption Editor & AI Assistant */}
          <CaptionEditor caption={caption} onChangeCaption={setCaption} />

          {/* Advanced Instagram Settings Accordion */}
          <PublishingOptions
            firstComment={firstComment}
            onChangeFirstComment={setFirstComment}
            autoPlaceHashtagsInComment={autoPlaceHashtags}
            onToggleAutoPlaceHashtags={setAutoPlaceHashtags}
            taggedHandles={taggedHandles}
            onChangeTaggedHandles={setTaggedHandles}
            location={location}
            onChangeLocation={setLocation}
            shareToFacebook={shareToFacebook}
            onToggleShareToFacebook={setShareToFacebook}
            hideLikeCount={hideLikeCount}
            onToggleHideLikeCount={setHideLikeCount}
            disableComments={disableComments}
            onToggleDisableComments={setDisableComments}
          />

          {/* Scheduling Strategy & Execution Controls */}
          <ScheduleControls
            strategy={strategy}
            onSelectStrategy={setStrategy}
            publishDate={publishDate}
            onChangePublishDate={setPublishDate}
            publishTime={publishTime}
            onChangePublishTime={setPublishTime}
            timezone={timezone}
            onChangeTimezone={setTimezone}
            onDiscard={handleDiscard}
            onSaveDraft={() => handleSchedulePost()}
            onSchedulePost={handleSchedulePost}
            isSubmitting={isSubmitting}
          />
        </section>

        {/* RIGHT PANEL: 40% LIVE PREVIEW */}
        <div className="xl:col-span-5">
          <FeedSimulator
            mediaList={mediaList}
            caption={caption}
            firstComment={firstComment}
            location={location}
            scheduledDateLabel={`Scheduled for ${publishDate} • ${publishTime} (${timezone.split(" ")[0]})`}
          />
        </div>
      </div>
    </div>
  );
}
