"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mockDrafts, MockDraft } from "@/lib/demo/mockData";

export default function DraftsPage() {
  const router = useRouter();

  const [drafts, setDrafts] = useState<MockDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [inspectingDraft, setInspectingDraft] = useState<MockDraft | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/posts?type=drafts");
      const data = await res.json();
      if (data.drafts && Array.isArray(data.drafts) && data.drafts.length > 0) {
        setDrafts(data.drafts);
      } else {
        setDrafts(mockDrafts);
      }
    } catch (err) {
      console.warn("Using demo fixtures fallback for drafts:", err);
      setDrafts(mockDrafts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    drafts.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [drafts]);

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      if (filterType !== "ALL" && draft.mediaType !== filterType) return false;

      if (filterCategory !== "ALL" && draft.category !== filterCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = draft.title.toLowerCase().includes(q);
        const matchCaption = draft.caption.toLowerCase().includes(q);
        const matchHashtags = draft.hashtags.some((h) => h.toLowerCase().includes(q));
        if (!matchTitle && !matchCaption && !matchHashtags) return false;
      }

      return true;
    });
  }, [drafts, filterType, filterCategory, searchQuery]);

  const handleEditInStudio = (draft: MockDraft) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("composer_import_draft", JSON.stringify(draft));
    }
    router.push("/dashboard/create");
  };

  const handleDuplicateDraft = (draft: MockDraft, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const duplicated: MockDraft = {
      ...draft,
      id: `draft_${Date.now()}`,
      title: `${draft.title} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    setDrafts((prev) => [duplicated, ...prev]);
    showToast(`📋 Duplicated "${draft.title}"!`);
  };

  const handleQuickSchedule = async (draft: MockDraft, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionLoadingId(draft.id);

    try {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const publishResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: "SCHEDULE",
          format: draft.mediaType === "REEL" ? "REEL" : "FEED",
          caption: draft.caption,
          mediaItems: [{ url: draft.thumbnailUrl }],
          publishDate: tomorrow,
          publishTime: "18:45",
          timezone: "PST (UTC-8)",
        }),
      });

      if (publishResponse.ok) {
        showToast(`🚀 Concept scheduled for tomorrow at 18:45!`);
        if (inspectingDraft?.id === draft.id) setInspectingDraft(null);
      }
    } catch {
      showToast("Failed to schedule draft.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteDraft = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this draft?")) return;

    setActionLoadingId(id);
    try {
      await fetch(`/api/posts?id=${id}&type=draft`, {
        method: "DELETE",
      });
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (inspectingDraft?.id === id) setInspectingDraft(null);
      showToast("Draft deleted successfully.");
    } catch (err) {
      console.error("Error deleting draft:", err);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      showToast("Draft deleted from local staging.");
    } finally {
      setActionLoadingId(null);
    }
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

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Drafts & Staging Studio
            </h1>
            <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-primary">
              {drafts.length} Concepts Staged
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Visual concepts, experimental hooks, and unfinalized posts ready for 1-click studio refinement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/create?mode=draft"
            className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-xs font-semibold text-on-primary-container shadow-[0_0_20px_-3px_rgba(255,76,131,0.3)] transition-all hover:brightness-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Concept</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Format Tabs & Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-surface-container p-1">
            {(
              [
                { id: "ALL", label: "All Formats" },
                { id: "CAROUSEL", label: "Carousels" },
                { id: "REEL", label: "Reels" },
                { id: "IMAGE", label: "Photos" },
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

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search Field */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search concepts or hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container pl-9 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-primary sm:w-64"
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
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container/20 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-[24px]">draft</span>
          </div>
          <h3 className="mt-4 text-base font-bold text-on-surface">
            No Drafts Found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-on-surface-variant">
            {searchQuery || filterType !== "ALL" || filterCategory !== "ALL"
              ? "No drafts match your active filter criteria."
              : "Start a concept in the studio and choose 'Save as Draft' to stage it here for later refinement."}
          </p>
          <div className="mt-5 flex gap-2">
            {(searchQuery || filterType !== "ALL" || filterCategory !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setFilterType("ALL");
                  setFilterCategory("ALL");
                  setSearchQuery("");
                }}
                className="rounded-xl bg-surface-container px-4 py-2 text-xs font-semibold text-primary hover:bg-surface-container-high"
              >
                Reset Filters
              </button>
            )}
            <Link
              href="/dashboard/create?mode=draft"
              className="rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary-container hover:brightness-105"
            >
              Create New Draft
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDrafts.map((draft) => {
            const dateStr = new Date(draft.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={draft.id}
                onClick={() => setInspectingDraft(draft)}
                className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low shadow-sm transition-all duration-200 hover:border-outline-variant/50 hover:shadow-xl"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.thumbnailUrl}
                    alt={draft.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent opacity-80" />

                  {/* Format & Category Badges */}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span className="rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                      {draft.mediaType}
                    </span>
                    {draft.category && (
                      <span className="rounded-md bg-primary/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                        {draft.category}
                      </span>
                    )}
                  </div>

                  {draft.aspectRatio && (
                    <span className="absolute right-3 top-3 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                      {draft.aspectRatio}
                    </span>
                  )}

                  <span className="absolute bottom-2 left-3 text-[11px] font-medium text-on-surface-variant">
                    Updated {dateStr}
                  </span>
                </div>

                {/* Content Details */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-sm font-bold text-on-surface">
                    {draft.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-on-surface-variant">
                    {draft.caption}
                  </p>

                  {/* Hashtag Chips */}
                  {draft.hashtags && draft.hashtags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {draft.hashtags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                      {draft.hashtags.length > 3 && (
                        <span className="text-[10px] text-on-surface-variant">
                          +{draft.hashtags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between border-t border-outline-variant/15 p-3.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditInStudio(draft);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:brightness-105 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      edit_square
                    </span>
                    <span>Edit in Studio</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Duplicate Concept"
                      onClick={(e) => handleDuplicateDraft(draft, e)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        content_copy
                      </span>
                    </button>

                    <button
                      type="button"
                      title="Quick Schedule for Tomorrow"
                      disabled={actionLoadingId === draft.id}
                      onClick={(e) => handleQuickSchedule(draft, e)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-surface-container hover:text-secondary"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        calendar_clock
                      </span>
                    </button>

                    <button
                      type="button"
                      title="Delete Draft"
                      disabled={actionLoadingId === draft.id}
                      onClick={(e) => handleDeleteDraft(draft.id, e)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/15"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspector Modal */}
      {inspectingDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setInspectingDraft(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-high shadow-2xl md:flex-row"
          >
            {/* Media Column */}
            <div className="relative aspect-square w-full bg-black/90 md:w-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspectingDraft.thumbnailUrl}
                alt={inspectingDraft.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                {inspectingDraft.mediaType}
              </span>
            </div>

            {/* Content Column */}
            <div className="flex w-full flex-col justify-between p-6 md:w-1/2">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-on-surface">
                    {inspectingDraft.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setInspectingDraft(null)}
                    className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="mt-4 max-h-48 overflow-y-auto rounded-xl bg-surface-container p-3 text-xs leading-relaxed text-on-surface">
                  <p className="whitespace-pre-wrap">{inspectingDraft.caption}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>{inspectingDraft.caption.length} characters</span>
                  <span>{inspectingDraft.hashtags.length} hashtags</span>
                </div>

                {inspectingDraft.hashtags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {inspectingDraft.hashtags.map((h) => (
                      <span
                        key={h}
                        className="rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleEditInStudio(inspectingDraft)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-105 active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    edit_square
                  </span>
                  <span>Open in Creator Studio</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleQuickSchedule(inspectingDraft, e)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary hover:bg-secondary/20"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      calendar_clock
                    </span>
                    <span>Quick Schedule</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteDraft(inspectingDraft.id, e)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      delete
                    </span>
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
