"use client";

import React from "react";

interface PublishingOptionsProps {
  firstComment: string;
  onChangeFirstComment: (value: string) => void;
  autoPlaceHashtagsInComment: boolean;
  onToggleAutoPlaceHashtags: (val: boolean) => void;
  taggedHandles: string;
  onChangeTaggedHandles: (val: string) => void;
  location: string;
  onChangeLocation: (val: string) => void;
  shareToFacebook: boolean;
  onToggleShareToFacebook: (val: boolean) => void;
  hideLikeCount: boolean;
  onToggleHideLikeCount: (val: boolean) => void;
  disableComments: boolean;
  onToggleDisableComments: (val: boolean) => void;
}

export default function PublishingOptions({
  firstComment,
  onChangeFirstComment,
  autoPlaceHashtagsInComment,
  onToggleAutoPlaceHashtags,
  taggedHandles,
  onChangeTaggedHandles,
  location,
  onChangeLocation,
  shareToFacebook,
  onToggleShareToFacebook,
  hideLikeCount,
  onToggleHideLikeCount,
  disableComments,
  onToggleDisableComments,
}: PublishingOptionsProps) {
  return (
    <details
      className="group rounded-xl bg-surface-container-low p-space-lg shadow-sm"
      open
    >
      <summary className="flex cursor-pointer select-none list-none items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            tune
          </span>
          <h2 className="text-sm font-semibold text-on-surface">
            Publishing Options &amp; Enhancements
          </h2>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180">
          expand_more
        </span>
      </summary>

      <div className="mt-space-md flex flex-col gap-space-md pt-space-md">
        {/* Automated First Comment */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <label
              htmlFor="first-comment"
              className="flex items-center gap-1.5 text-xs font-medium text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                chat
              </span>
              <span>Automated First Comment</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-on-surface-variant">
                Auto-place hashtags here
              </span>
              <input
                type="checkbox"
                checked={autoPlaceHashtagsInComment}
                onChange={(e) => onToggleAutoPlaceHashtags(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
            </div>
          </div>
          <input
            id="first-comment"
            type="text"
            value={firstComment}
            onChange={(e) => onChangeFirstComment(e.target.value)}
            placeholder="Drop a comment automatically once published..."
            className="h-10 rounded-lg bg-surface-container-lowest px-3 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Tag People & Add Location Row */}
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <div className="flex flex-col gap-space-xs">
            <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                person_add
              </span>
              <span>Tag People / Products</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={taggedHandles}
                onChange={(e) => onChangeTaggedHandles(e.target.value)}
                placeholder="Search handles or catalog SKU..."
                className="h-10 w-full rounded-lg bg-surface-container-lowest pl-9 pr-3 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                alternate_email
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                location_on
              </span>
              <span>Add Location</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => onChangeLocation(e.target.value)}
                placeholder="Add location tag..."
                className="h-10 w-full rounded-lg bg-surface-container-lowest pl-9 pr-3 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-primary">
                pin_drop
              </span>
            </div>
          </div>
        </div>

        {/* Social Cross-Publishing & Toggles */}
        <div className="flex flex-col gap-space-sm pt-space-xs">
          <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877F2]/20 text-sm font-bold text-[#1877F2]">
                f
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface">
                  Share to Facebook Page
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  Cross-publish simultaneously to linked page
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={shareToFacebook}
              onChange={(e) => onToggleShareToFacebook(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-sm">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-on-surface">
                  Hide Like &amp; View Count
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  Only you see the totals
                </span>
              </div>
              <input
                type="checkbox"
                checked={hideLikeCount}
                onChange={(e) => onToggleHideLikeCount(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-sm">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-on-surface">
                  Turn Off Commenting
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  Disable replies globally
                </span>
              </div>
              <input
                type="checkbox"
                checked={disableComments}
                onChange={(e) => onToggleDisableComments(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
