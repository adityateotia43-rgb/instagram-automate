"use client";

import React, { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { mockMediaAssets, MockMediaAsset } from "@/lib/demo/mockData";

export default function MediaLibraryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<MockMediaAsset[]>(() => mockMediaAssets);
  const [filterType, setFilterType] = useState<"ALL" | "IMAGE" | "REEL" | "VIDEO">("ALL");
  const [filterRatio, setFilterRatio] = useState<string>("ALL");
  const [filterTag, setFilterTag] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [inspectingAsset, setInspectingAsset] = useState<MockMediaAsset | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => a.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [assets]);

  const storageStats = useMemo(() => {
    const totalBytes = assets.reduce((acc, a) => acc + (a.sizeBytes || 3000000), 0);
    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const quotaGB = 25.0;
    const percentUsed = Math.min(100, Math.round((totalGB / quotaGB) * 100));
    return {
      usedFormatted: totalGB < 1 ? `${(totalGB * 1024).toFixed(0)} MB` : `${totalGB.toFixed(1)} GB`,
      quotaFormatted: `${quotaGB} GB`,
      percent: percentUsed,
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (filterType !== "ALL" && a.type !== filterType) return false;

      if (filterRatio !== "ALL" && a.aspectRatio !== filterRatio) return false;

      if (filterTag !== "ALL" && (!a.tags || !a.tags.includes(filterTag))) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesTag = a.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTag) return false;
      }

      return true;
    });
  }, [assets, filterType, filterRatio, filterTag, searchQuery]);

  const processFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ];

    const validFiles: File[] = [];
    for (const f of fileList) {
      if (!allowedMimes.includes(f.type)) {
        showToast(`"${f.name}" is not supported. Please use JPG, PNG, WEBP, or MP4/MOV.`);
        continue;
      }
      const isVideo = f.type.startsWith("video/");
      const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
      if (f.size > maxSize) {
        showToast(`"${f.name}" exceeds max size of ${maxSize / (1024 * 1024)}MB.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(15);

    try {
      // Simulate stepped progress
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 20 : prev));
      }, 150);

      const formData = new FormData();
      validFiles.forEach((f) => formData.append("files", f));

      try {
        await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });
      } catch (err) {
        console.warn("API upload fallback to local state demo:", err);
      }

      clearInterval(progressTimer);
      setUploadProgress(100);

      // Create new MockMediaAsset objects using object URLs for instant demo display
      const newAssets: MockMediaAsset[] = validFiles.map((file, idx) => {
        const isVid = file.type.startsWith("video/");
        const blobUrl = URL.createObjectURL(file);
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        return {
          id: `asset_${Date.now()}_${idx}`,
          name: file.name,
          url: blobUrl,
          type: isVid ? "REEL" : "IMAGE",
          aspectRatio: isVid ? "9:16" : "1:1",
          dimensions: isVid ? "1080 × 1920" : "2160 × 2160",
          size: `${mb} MB`,
          sizeBytes: file.size,
          uploadedAt: "Just now",
          tags: ["Upload", isVid ? "Video" : "Photo"],
        };
      });

      setAssets((prev) => [...newAssets, ...prev]);
      showToast(`Successfully imported ${newAssets.length} asset(s) to media library.`);
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to process upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedMediaId) => selectedMediaId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map((a) => a.id));
    }
  };

  const handleSendToComposer = (asset: MockMediaAsset) => {
    const composerItem = {
      id: asset.id,
      url: asset.url,
      alt: asset.name,
      dimensions: asset.dimensions,
      order: 0,
      fileType: asset.type === "REEL" || asset.type === "VIDEO" ? "VIDEO" : "IMAGE",
      formattedSize: asset.size,
      aspectRatio: asset.aspectRatio === "9:16" ? "1:1" : asset.aspectRatio,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("composer_import_media", JSON.stringify([composerItem]));
    }
    router.push("/dashboard/create");
  };

  const handleSendSelectedToComposer = () => {
    if (selectedIds.length === 0) return;

    const selectedAssets = assets.filter((a) => selectedIds.includes(a.id));
    const composerItems = selectedAssets.map((asset, idx) => ({
      id: asset.id,
      url: asset.url,
      alt: asset.name,
      dimensions: asset.dimensions,
      order: idx,
      fileType: asset.type === "REEL" || asset.type === "VIDEO" ? "VIDEO" : "IMAGE",
      formattedSize: asset.size,
      aspectRatio: asset.aspectRatio === "9:16" ? "1:1" : asset.aspectRatio,
    }));

    if (typeof window !== "undefined") {
      sessionStorage.setItem("composer_import_media", JSON.stringify(composerItems));
    }
    router.push("/dashboard/create");
  };

  const handleDeleteAsset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to remove this asset from your cloud library?")) return;
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => prev.filter((selectedMediaId) => selectedMediaId !== id));
    if (inspectingAsset?.id === id) setInspectingAsset(null);
    showToast("Asset removed from library.");
  };

  const handleBatchDelete = () => {
    if (!confirm(`Delete ${selectedIds.length} selected assets from your cloud library?`)) return;
    setAssets((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
    showToast(`Deleted ${selectedIds.length} assets.`);
    setSelectedIds([]);
  };

  return (
    <div className="mx-auto max-w-7xl px-space-md py-space-lg sm:px-space-xl">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-primary/40 bg-surface-container-high px-4 py-3 text-xs font-semibold text-on-surface shadow-2xl backdrop-blur-xl">
          <span className="material-symbols-outlined text-[18px] text-primary">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Media Asset Library
            </h1>
            <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-primary">
              {assets.length} Assets
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Cloud-synced high-resolution creative media with 1-click export into Post Creator Studio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-xs font-semibold text-on-primary-container shadow-[0_0_20px_-3px_rgba(255,76,131,0.3)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isUploading ? "sync" : "cloud_upload"}
            </span>
            <span>{isUploading ? "Uploading..." : "Upload New Assets"}</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(255,76,131,0.2)]"
            : "border-outline-variant/30 bg-surface-container/40 hover:border-primary/50 hover:bg-surface-container/70"
        }`}
      >
        {isUploading ? (
          <div className="w-full max-w-md py-4">
            <div className="flex items-center justify-between text-xs text-on-surface">
              <span className="font-semibold text-primary">Processing batch upload...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-primary shadow-inner ">
              <span className="material-symbols-outlined text-[26px]">
                add_photo_alternate
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-on-surface">
              Drag & Drop high-res images or videos here, or{" "}
              <span className="text-primary underline underline-offset-2">browse files</span>
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              Supports JPG, PNG, WebP up to 20MB & MP4, QuickTime up to 100MB • Auto-scales to Instagram ratios
            </p>
          </div>
        )}
      </div>

      {/* Controls & Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Type tabs & aspect ratio selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Tabs */}
          <div className="flex rounded-xl bg-surface-container p-1">
            {(
              [
                { id: "ALL", label: "All Assets" },
                { id: "IMAGE", label: "Photos" },
                { id: "REEL", label: "Reels" },
                { id: "VIDEO", label: "Videos" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterType === tab.id
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Aspect Ratio Filter */}
          <select
            value={filterRatio}
            onChange={(e) => setFilterRatio(e.target.value)}
            className="rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary"
          >
            <option value="ALL">All Aspect Ratios</option>
            <option value="1:1">1:1 Square</option>
            <option value="4:5">4:5 Portrait</option>
            <option value="9:16">9:16 Reel Vertical</option>
            <option value="16:9">16:9 Landscape</option>
          </select>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary"
            >
              <option value="ALL">All Categories / Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Live Search & Cloud Storage Telemetry */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Field */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search filename or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container pl-9 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-primary sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>

          {/* Storage Telemetry */}
          <div className="flex items-center gap-3 rounded-xl bg-surface-container px-3 py-1.5 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              cloud_done
            </span>
            <span>
              {storageStats.usedFormatted} / {storageStats.quotaFormatted}
            </span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${storageStats.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Selection Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 mb-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-surface-container-high/95 p-3.5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-on-surface">
              Asset{selectedIds.length > 1 ? "s" : ""} selected for batch operation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendSelectedToComposer}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-lg transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">
                view_carousel
              </span>
              <span>Create Carousel in Studio ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              className="flex items-center gap-1 rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
            >
              <span className="material-symbols-outlined text-[15px]">delete</span>
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Select All / Count Bar */}
      <div className="mb-4 flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={selectAll}
            className="flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">
              {selectedIds.length === filteredAssets.length && filteredAssets.length > 0
                ? "check_box"
                : "check_box_outline_blank"}
            </span>
            <span>
              {selectedIds.length === filteredAssets.length && filteredAssets.length > 0
                ? "Deselect All"
                : "Select All"}
            </span>
          </button>
          <span>•</span>
          <span>Showing {filteredAssets.length} of {assets.length} media assets</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container/20 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
            <span className="material-symbols-outlined text-[28px]">perm_media</span>
          </div>
          <h3 className="mt-3 text-sm font-bold text-on-surface">No media assets found</h3>
          <p className="mt-1 max-w-xs text-xs text-on-surface-variant">
            Try adjusting your search query, clearing filters, or drag and drop new photos and videos to import.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterType("ALL");
              setFilterRatio("ALL");
              setFilterTag("ALL");
              setSearchQuery("");
            }}
            className="mt-4 rounded-xl bg-surface-container-high px-4 py-2 text-xs font-semibold text-primary hover:bg-surface-container"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredAssets.map((asset) => {
          const isSelected = selectedIds.includes(asset.id);
          return (
            <div
              key={asset.id}
              onClick={() => setInspectingAsset(asset)}
              className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface-container-low transition-all duration-200 hover:shadow-2xl ${
                isSelected
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-outline-variant/20 hover:border-outline-variant/50"
              }`}
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="h-full w-full object-cover "
                />

                {/* Selection Checkbox (Top Left) */}
                <button
                  type="button"
                  onClick={(e) => toggleSelect(asset.id, e)}
                  className={`absolute left-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-lg backdrop-blur-md transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-md"
                      : "bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/90"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {isSelected ? "check" : ""}
                  </span>
                </button>

                {/* Format / Type Badge (Top Right) */}
                <span className="absolute right-2.5 top-2.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  {asset.type}
                </span>

                {/* Aspect Ratio & Resolution Badge (Bottom Left) */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-primary backdrop-blur-sm">
                    {asset.aspectRatio}
                  </span>
                  <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm">
                    {asset.dimensions}
                  </span>
                </div>

                {/* Hover Quick Action Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendToComposer(asset);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-lg transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      post_add
                    </span>
                    <span>Use in Studio</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingAsset(asset);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/25 backdrop-blur-md"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        visibility
                      </span>
                      <span>Inspect</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteAsset(asset.id, e)}
                      className="flex items-center gap-1 rounded-lg bg-rose-500/20 px-2.5 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/35 backdrop-blur-md"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        delete
                      </span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Asset Information Footer */}
              <div className="flex flex-col p-3">
                <p className="truncate text-xs font-semibold text-on-surface" title={asset.name}>
                  {asset.name}
                </p>

                <div className="mt-1 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>{asset.size}</span>
                  <span>{asset.uploadedAt}</span>
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {asset.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-surface-container px-1.5 py-0.5 text-[9px] font-medium text-on-surface-variant"
                      >
                        #{t}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="rounded bg-surface-container px-1 py-0.5 text-[9px] text-on-surface-variant">
                        +{asset.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Asset Detail Modal */}
      {inspectingAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setInspectingAsset(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-high shadow-2xl md:flex-row"
          >
            {/* Visual Viewport */}
            <div className="relative flex aspect-square w-full items-center justify-center bg-black/90 md:w-1/2">
              {inspectingAsset.type === "REEL" || inspectingAsset.type === "VIDEO" ? (
                <video
                  src={inspectingAsset.url}
                  controls
                  autoPlay
                  loop
                  muted
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={inspectingAsset.url}
                  alt={inspectingAsset.name}
                  className="max-h-full max-w-full object-contain"
                />
              )}

              <span className="absolute left-4 top-4 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {inspectingAsset.type}
              </span>
            </div>

            {/* Metadata & Controls Column */}
            <div className="flex w-full flex-col justify-between p-6 md:w-1/2">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="break-all text-base font-bold text-on-surface">
                    {inspectingAsset.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setInspectingAsset(null)}
                    className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Metadata Specs Grid */}
                <div className="mt-5 space-y-2.5 border-y border-outline-variant/20 py-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Aspect Ratio</span>
                    <span className="font-semibold text-primary">{inspectingAsset.aspectRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Native Resolution</span>
                    <span className="font-medium text-on-surface">{inspectingAsset.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">File Size</span>
                    <span className="font-medium text-on-surface">{inspectingAsset.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Date Ingested</span>
                    <span className="font-medium text-on-surface">{inspectingAsset.uploadedAt}</span>
                  </div>
                </div>

                {/* Tags */}
                {inspectingAsset.tags && inspectingAsset.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold text-on-surface-variant">Associated Tags</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {inspectingAsset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-surface-container px-2 py-1 text-xs font-medium text-on-surface"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleSendToComposer(inspectingAsset)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-transform hover:brightness-105 active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    post_add
                  </span>
                  <span>Use in Post Creator Studio</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inspectingAsset.url);
                      showToast("Asset URL copied to clipboard!");
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    <span>Copy URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(inspectingAsset.id)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
