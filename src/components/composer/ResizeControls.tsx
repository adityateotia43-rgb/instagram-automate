"use client";

import React from "react";

export type AspectRatio = "1:1" | "4:5" | "16:9";

interface ResizeControlsProps {
  selectedRatio: AspectRatio;
  onSelectRatio: (ratio: AspectRatio) => void;
}

export default function ResizeControls({
  selectedRatio,
  onSelectRatio,
}: ResizeControlsProps) {
  const ratios: { id: AspectRatio; label: string }[] = [
    { id: "1:1", label: "1:1 Square" },
    { id: "4:5", label: "4:5 Portrait" },
    { id: "16:9", label: "16:9 Wide" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-surface-container-high p-1">
      {ratios.map((ratio) => {
        const isSelected = selectedRatio === ratio.id;
        return (
          <button
            key={ratio.id}
            type="button"
            onClick={() => onSelectRatio(ratio.id)}
            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-all ${
              isSelected
                ? "bg-surface-container text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {ratio.label}
          </button>
        );
      })}
    </div>
  );
}
