"use client";

import React from "react";

export type PostFormat = "FEED" | "REEL" | "STORY";

interface FormatSelectorProps {
  selectedFormat: PostFormat;
  onSelectFormat: (format: PostFormat) => void;
}

export default function FormatSelector({
  selectedFormat,
  onSelectFormat,
}: FormatSelectorProps) {
  const formats: { id: PostFormat; label: string; icon: string }[] = [
    {
      id: "FEED",
      label: "Feed Post (Single / Carousel)",
      icon: "view_carousel",
    },
    { id: "REEL", label: "Reel", icon: "movie" },
    { id: "STORY", label: "Story", icon: "history_toggle_off" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 shadow-sm">
      {formats.map((fmt) => {
        const isSelected = selectedFormat === fmt.id;
        return (
          <button
            key={fmt.id}
            type="button"
            onClick={() => onSelectFormat(fmt.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-space-sm py-2.5 text-xs font-semibold transition-all ${
              isSelected
                ? "bg-surface-container text-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {fmt.icon}
            </span>
            <span>{fmt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
