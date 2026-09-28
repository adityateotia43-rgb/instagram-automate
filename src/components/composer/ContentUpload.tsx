"use client";

import React, { useState, useRef, useCallback } from "react";
import ResizeControls, { AspectRatio } from "./ResizeControls";

export interface MediaUploadItem {
  id: string;
  url: string;
  alt?: string;
  dimensions?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  formattedSize?: string;
  fileType: "IMAGE" | "VIDEO";
  order: number;
  progress?: number;
  isUploading?: boolean;
  file?: File;
}

interface ValidationError {
  id: string;
  filename: string;
  message: string;
}

interface ContentUploadProps {
  mediaList: MediaUploadItem[];
  onMediaChange: (items: MediaUploadItem[]) => void;
  selectedRatio: AspectRatio;
  onSelectRatio: (ratio: AspectRatio) => void;
  maxFiles?: number;
  maxImageSizeMb?: number;
  maxVideoSizeMb?: number;
  isDemoMode?: boolean;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_IMAGE_MB = 20;
const DEFAULT_MAX_VIDEO_MB = 100;

export default function ContentUpload({
  mediaList,
  onMediaChange,
  selectedRatio,
  onSelectRatio,
  maxFiles = DEFAULT_MAX_FILES,
  maxImageSizeMb = DEFAULT_MAX_IMAGE_MB,
  maxVideoSizeMb = DEFAULT_MAX_VIDEO_MB,
  isDemoMode = true,
}: ContentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [inspectItem, setInspectItem] = useState<MediaUploadItem | null>(null);

  const getAspectRatioClass = () => {
    switch (selectedRatio) {
      case "4:5":
        return "aspect-[4/5]";
      case "16:9":
        return "aspect-[16/9]";
      case "1:1":
      default:
        return "aspect-square";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const extractMediaDimensions = (
    file: File,
    url: string
  ): Promise<{ width: number; height: number; dimensions: string }> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = url;
        video.onloadedmetadata = () => {
          const w = video.videoWidth || 1080;
          const h = video.videoHeight || 1920;
          resolve({ width: w, height: h, dimensions: `${w} × ${h}` });
        };
        video.onerror = () => {
          resolve({ width: 1080, height: 1920, dimensions: "1080 × 1920" });
        };
      } else {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          const w = img.naturalWidth || 2160;
          const h = img.naturalHeight || 2160;
          resolve({ width: w, height: h, dimensions: `${w} × ${h}` });
        };
        img.onerror = () => {
          resolve({ width: 2160, height: 2160, dimensions: "2160 × 2160" });
        };
      }
    });
  };

  const processFiles = useCallback(
    async (rawFiles: File[]) => {
      const errors: ValidationError[] = [];
      const validFiles: File[] = [];

      const currentCount = mediaList.length;
      const availableSlots = maxFiles - currentCount;

      if (availableSlots <= 0) {
        setValidationErrors([
          {
            id: `err-${Date.now()}`,
            filename: "Upload Limit Reached",
            message: `Instagram carousels support up to ${maxFiles} items maximum.`,
          },
        ]);
        return;
      }

      for (const file of rawFiles) {
        if (file.size === 0) {
          errors.push({
            id: `err-${Date.now()}-${Math.random()}`,
            filename: file.name,
            message: "File is empty (0 bytes). Please select a valid photo or video.",
          });
          continue;
        }

        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

        if (!isImage && !isVideo) {
          const ext = file.name.includes(".") ? file.name.split(".").pop()?.toUpperCase() : "Format";
          errors.push({
            id: `err-${Date.now()}-${Math.random()}`,
            filename: file.name,
            message: `Unsupported ${ext} format. Instagram supports JPG, PNG, WEBP for photos, and MP4 or MOV for videos.`,
          });
          continue;
        }

        if (isImage && file.size > maxImageSizeMb * 1024 * 1024) {
          errors.push({
            id: `err-${Date.now()}-${Math.random()}`,
            filename: file.name,
            message: `Image exceeds ${maxImageSizeMb}MB limit (${formatFileSize(file.size)}). Please compress or resize before attaching.`,
          });
          continue;
        }

        if (isVideo && file.size > maxVideoSizeMb * 1024 * 1024) {
          errors.push({
            id: `err-${Date.now()}-${Math.random()}`,
            filename: file.name,
            message: `Video exceeds ${maxVideoSizeMb}MB limit (${formatFileSize(file.size)}). Please trim or compress the video.`,
          });
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length > availableSlots) {
        errors.push({
          id: `err-slot-${Date.now()}`,
          filename: `${validFiles.length} files selected`,
          message: `Only ${availableSlots} more slot(s) available. Extra files were excluded.`,
        });
        validFiles.splice(availableSlots);
      }

      if (errors.length > 0) {
        setValidationErrors((prev) => [...errors, ...prev].slice(0, 4));
      }

      if (validFiles.length === 0) return;

      // Create instant blob URLs with simulated upload progress
      const newItems: MediaUploadItem[] = validFiles.map((file, idx) => {
        const objectUrl = URL.createObjectURL(file);
        return {
          id: `media-${Date.now()}-${idx}`,
          url: objectUrl,
          alt: file.name,
          dimensions: "Calculating...",
          sizeBytes: file.size,
          formattedSize: formatFileSize(file.size),
          fileType: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
          order: currentCount + idx,
          isUploading: true,
          progress: 35,
          file,
        };
      });

      const updatedList = [...mediaList, ...newItems];
      onMediaChange(updatedList);

      for (const uploadItem of newItems) {
        if (!uploadItem.file) continue;
        const dims = await extractMediaDimensions(uploadItem.file, uploadItem.url);

        // Simulate high-speed upload completion for demo mode
        setTimeout(() => {
          onMediaChange(
            updatedList.map((m) =>
              m.id === uploadItem.id
                ? {
                    ...m,
                    dimensions: dims.dimensions,
                    width: dims.width,
                    height: dims.height,
                    isUploading: false,
                    progress: 100,
                  }
                : m
            )
          );
        }, 350);
      }

      // If in production/non-demo mode, trigger backend upload in parallel
      if (!isDemoMode) {
        try {
          const formData = new FormData();
          validFiles.forEach((f) => formData.append("files", f));
          fetch("/api/media/upload", { method: "POST", body: formData });
        } catch {
          // Graceful fallback to local blobs in demo store
        }
      }
    },
    [
      mediaList,
      maxFiles,
      maxImageSizeMb,
      maxVideoSizeMb,
      isDemoMode,
      onMediaChange,
    ]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = ""; // reset for re-selection
    }
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const reordered = [...mediaList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const reindexed = reordered.map((mediaFile, mediaIndex) => ({ ...mediaFile, order: mediaIndex }));
    onMediaChange(reindexed);
  };

  const handleRemove = (id: string) => {
    const filtered = mediaList
      .filter((mediaFile) => mediaFile.id !== id)
      .map((mediaFile, mediaIndex) => ({ ...mediaFile, order: mediaIndex }));
    onMediaChange(filtered);
    if (inspectItem?.id === id) setInspectItem(null);
  };

  const dismissError = (id: string) => {
    setValidationErrors((prev) => prev.filter((err) => err.id !== id));
  };

  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            photo_library
          </span>
          <h2 className="text-sm font-semibold text-on-surface">
            Media Gallery &amp; Uploader
          </h2>
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
            {mediaList.length} / {maxFiles} Assets Attached
          </span>
          {isDemoMode && (
            <span className="rounded-full bg-tertiary/10 px-2 py-0.5 text-[10px] font-semibold text-tertiary">
              Demo Local Mode
            </span>
          )}
        </div>

        {/* Aspect Ratio Switcher */}
        <ResizeControls
          selectedRatio={selectedRatio}
          onSelectRatio={onSelectRatio}
        />
      </div>

      {/* Validation Error Notices */}
      {validationErrors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-error font-medium px-1">
            <span>{validationErrors.length} validation notice{validationErrors.length > 1 ? "s" : ""}:</span>
            <button
              type="button"
              onClick={() => setValidationErrors([])}
              className="text-on-surface-variant hover:text-on-surface underline text-[10px]"
            >
              Clear all notices
            </button>
          </div>
          {validationErrors.map((err) => (
            <div
              key={err.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-xs text-on-surface backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-error">
                  warning
                </span>
                <div>
                  <span className="font-semibold text-error">{err.filename}:</span>{" "}
                  <span className="text-on-surface-variant">{err.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissError(err.id)}
                className="flex h-5 w-5 items-center justify-center rounded text-on-surface-variant hover:bg-error-container hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media Thumbnails & Dropzone Grid */}
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 md:grid-cols-3">
        {mediaList.map((media, index) => (
          <div
            key={media.id}
            className={`group relative overflow-hidden rounded-xl bg-surface-container-high shadow-sm transition-all hover:shadow-md ${getAspectRatioClass()}`}
          >
            {/* Visual Media Content */}
            {media.fileType === "VIDEO" ? (
              <div className="relative h-full w-full bg-black">
                <video
                  src={media.url}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-dim/80 text-on-surface backdrop-blur-md">
                    <span className="material-symbols-outlined text-[20px]">
                      play_arrow
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt={media.alt || `Media item ${index + 1}`}
                className="h-full w-full object-cover "
              />
            )}

            {/* Upload Progress Overlay (Demo Mode / Local) */}
            {media.isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
                <div className="flex h-8 w-8 animate-spin items-center justify-center rounded-full border-2 border-primary border-t-transparent mb-2" />
                <span className="text-[11px] font-semibold text-on-surface">
                  Processing...
                </span>
                <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${media.progress || 50}%` }}
                  />
                </div>
              </div>
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dim/90 via-transparent to-black/50 opacity-90 transition-opacity group-hover:opacity-100" />

            {/* Top Left: Slide Number & Cover Badge */}
            <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-surface-dim/80 px-2 py-0.5 backdrop-blur-md">
              <span className="text-[10px] font-bold text-on-surface">
                #{index + 1}
              </span>
              {index === 0 ? (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                  Cover
                </span>
              ) : null}
            </div>

            {/* Top Right: Reorder Buttons */}
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
              {index > 0 && (
                <button
                  type="button"
                  title="Move earlier in carousel"
                  onClick={() => handleMove(index, "left")}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-dim/80 text-on-surface-variant backdrop-blur-md transition-colors hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    arrow_back
                  </span>
                </button>
              )}
              {index < mediaList.length - 1 && (
                <button
                  type="button"
                  title="Move later in carousel"
                  onClick={() => handleMove(index, "right")}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-dim/80 text-on-surface-variant backdrop-blur-md transition-colors hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    arrow_forward
                  </span>
                </button>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="rounded bg-surface-dim/80 px-1.5 py-0.5 text-[9px] font-medium text-on-surface-variant backdrop-blur-sm">
                  {media.dimensions || "2160 × 2160"}
                </span>
                {media.formattedSize && (
                  <span className="rounded bg-surface-dim/80 px-1.5 py-0.5 text-[9px] font-medium text-on-surface-variant backdrop-blur-sm">
                    {media.formattedSize}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Inspect full resolution"
                  onClick={() => setInspectItem(media)}
                  className="flex h-6 w-6 items-center justify-center rounded bg-surface-dim/80 text-on-surface transition-colors hover:bg-surface-variant"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    visibility
                  </span>
                </button>
                <button
                  type="button"
                  title="Remove asset"
                  onClick={() => handleRemove(media.id)}
                  className="flex h-6 w-6 items-center justify-center rounded bg-surface-dim/80 text-error transition-colors hover:bg-error-container"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    delete
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Upload Dropzone Slot (if under limit) */}
        {mediaList.length < maxFiles && (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-space-md text-center transition-all ${getAspectRatioClass()} ${
              isDragOver
                ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(124,58,237,0.25)] ring-2 ring-primary/40"
                : "border-surface-container-highest bg-surface-container/60 hover:border-primary/50 hover:bg-surface-container"
            }`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-all ${
                isDragOver
                  ? "scale-110 bg-primary text-white"
                  : "bg-surface-container-high text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isDragOver ? "download" : "add_photo_alternate"}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-on-surface group-hover:text-primary">
                {isDragOver ? "Drop files to add" : "+ Add Media Assets"}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                Drag &amp; drop or browse
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-surface-container-high/80 px-2 py-0.5 text-[9px] text-on-surface-variant">
              <span>JPG, PNG, WEBP, MP4</span>
              <span>•</span>
              <span>Max 20MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox / Inspect Modal */}
      {inspectItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setInspectItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface-container-low shadow-2xl border border-outline-variant/30"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  {inspectItem.fileType === "VIDEO" ? "videocam" : "image"}
                </span>
                <span className="text-xs font-semibold text-on-surface truncate max-w-xs">
                  {inspectItem.alt || "Media Asset Preview"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Preview Area */}
            <div className="flex items-center justify-center bg-black/40 p-4 max-h-[60vh] overflow-hidden">
              {inspectItem.fileType === "VIDEO" ? (
                <video
                  src={inspectItem.url}
                  controls
                  autoPlay
                  className="max-h-[55vh] max-w-full rounded-lg object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inspectItem.url}
                  alt={inspectItem.alt || "Asset"}
                  className="max-h-[55vh] max-w-full rounded-lg object-contain"
                />
              )}
            </div>

            {/* Modal Meta Info Footer */}
            <div className="grid grid-cols-3 gap-2 border-t border-outline-variant/20 bg-surface-container px-4 py-3 text-[11px]">
              <div>
                <span className="text-on-surface-variant block">Dimensions</span>
                <span className="font-semibold text-on-surface">
                  {inspectItem.dimensions || "2160 × 2160"}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Type</span>
                <span className="font-semibold text-on-surface">
                  {inspectItem.fileType}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block">File Size</span>
                <span className="font-semibold text-on-surface">
                  {inspectItem.formattedSize || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
