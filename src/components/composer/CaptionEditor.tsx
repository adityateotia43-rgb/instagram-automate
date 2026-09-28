"use client";

import React, { useState, useRef } from "react";

interface CaptionEditorProps {
  caption: string;
  onChangeCaption: (value: string) => void;
}

interface HashtagCategory {
  name: string;
  tags: string[];
}

const hashtagCategories: HashtagCategory[] = [
  {
    name: "Design & Creative",
    tags: [
      "#designinspo",
      "#creativedirector",
      "#artdirection",
      "#minimalvisuals",
      "#visualidentity",
      "#typography",
    ],
  },
  {
    name: "Strategy & SaaS",
    tags: [
      "#saasbranding",
      "#brandstrategy",
      "#productdesign",
      "#buildinpublic",
      "#techfounder",
      "#growthdesign",
    ],
  },
  {
    name: "Growth & Engagement",
    tags: [
      "#socialmediatips",
      "#contentcreator",
      "#creatoreconomy",
      "#instagramgrowth",
      "#instaflow",
      "#audiencebuilding",
    ],
  },
];

type AiHookKey = "VIRAL" | "STORY" | "LAUNCH" | "QUESTION" | "EDUCATIONAL";

interface AiHookPreset {
  key: AiHookKey;
  label: string;
  icon: string;
  badge: string;
  description: string;
  content: string;
}

const aiHookPresets: AiHookPreset[] = [
  {
    key: "VIRAL",
    label: "Viral",
    icon: "bolt",
    badge: "High Retention",
    description: "Counterintuitive observation with immediate curiosity gap",
    content:
      "Stop posting into the void. 🛑 Here is the exact visual architecture high-growth creators use to command 3x higher retention.\n\nSave this breakdown before your next creative sprint! ✨\n\n#designinspo #creativedirector #socialmediatips #visualidentity",
  },
  {
    key: "STORY",
    label: "Story",
    icon: "auto_stories",
    badge: "Narrative Arc",
    description: "Authentic founder/creator journey with lessons learned",
    content:
      "We spent 6 months rebuilding our design studio from the ground up. Here are the 3 non-negotiables that changed everything:\n\n1. Relentless clarity over decoration\n2. High-chroma visual hierarchy\n3. Velocity of execution\n\nWhat is your team refining this quarter? 👇\n\n#saasbranding #brandstrategy #buildinpublic #instaflow",
  },
  {
    key: "LAUNCH",
    label: "Launch",
    icon: "rocket_launch",
    badge: "Anticipation",
    description: "High-urgency release with early access call-to-action",
    content:
      "The wait is over. 🚀 Introducing Horizon Drop 04 — engineered specifically for creator teams calibrating the visual velocity of modern digital culture.\n\nLimited early access is now open via the link in our bio. ✨\n\n#productdesign #visualidentity #creativedirector #launchday",
  },
  {
    key: "QUESTION",
    label: "Question",
    icon: "help",
    badge: "Comment Driver",
    description: "Engaging poll with interactive discussion prompt",
    content:
      "Quick pulse check for creators & founders: What is the single biggest bottleneck in your creative workflow right now?\n\nA) Ideation & Concepting\nB) Asset Production\nC) Consistency & Scheduling\n\nDrop your vote below! 👇💬\n\n#creatoreconomy #socialmediatips #buildinpublic",
  },
  {
    key: "EDUCATIONAL",
    label: "Educational",
    icon: "school",
    badge: "High Save Rate",
    description: "Actionable 5-point framework ideal for carousel carousels",
    content:
      "5 Principles for Flawless Instagram Grid Harmony 📐:\n\n1. Establish anchor tones every 3rd post\n2. Alternate between macro textures and micro details\n3. Keep text covers centered in a 1:1 safe zone\n4. Use high-contrast cover slides\n5. Test carousel slide momentum\n\nBookmark this reference for your next campaign! 📌✨\n\n#designinspo #artdirection #typography #growthdesign",
  },
];

const popularEmojis = [
  "✨", "🔥", "🚀", "💡", "👇", "🎯", "📈", "🖤", "💬", "📌",
  "👀", "💎", "⚡", "🙌", "🛑", "💯", "🎉", "👉", "✅", "🤯"
];

export default function CaptionEditor({
  caption,
  onChangeCaption,
}: CaptionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [selectedHookKey, setSelectedHookKey] = useState<AiHookKey | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const charCount = caption.length;
  const maxChars = 2200;
  const charPercent = Math.min((charCount / maxChars) * 100, 100);
  const isCharWarning = charCount > maxChars * 0.85 && charCount <= maxChars;
  const isCharOverLimit = charCount > maxChars;

  const wordCount = caption.trim() ? caption.trim().split(/\s+/).length : 0;

  const extractedHashtags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).map((h) =>
    h.toLowerCase()
  );
  const hashtagCount = extractedHashtags.length;
  const maxHashtags = 30;

  const extractedMentions = (caption.match(/@[a-zA-Z0-9_.]+/g) || []).map((m) =>
    m.toLowerCase()
  );
  const mentionCount = extractedMentions.length;
  const maxMentions = 20;

  const insertAtCursor = (prefix: string, suffix = "", defaultPlaceholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChangeCaption(caption + prefix + defaultPlaceholder + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = caption.substring(start, end);
    const textToInsert = selectedText || defaultPlaceholder;
    const replacement = `${prefix}${textToInsert}${suffix}`;

    const newCaption =
      caption.substring(0, start) + replacement + caption.substring(end);
    onChangeCaption(newCaption);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + replacement.length
        : start + prefix.length + defaultPlaceholder.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInsertEmoji = (emoji: string) => {
    insertAtCursor(emoji, " ");
  };

  const handleToggleHashtag = (tag: string) => {
    const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
    const regex = new RegExp(`\\s*${cleanTag}\\b`, "gi");

    if (extractedHashtags.includes(cleanTag.toLowerCase())) {
      const updated = caption.replace(regex, "").trim();
      onChangeCaption(updated);
    } else {
      if (hashtagCount >= maxHashtags) {
        alert("Instagram supports a maximum of 30 hashtags per post.");
        return;
      }
      const updated = caption.trim() ? `${caption.trim()} ${cleanTag}` : cleanTag;
      onChangeCaption(updated);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim().replace(/^#+/, "");
    if (!trimmed) return;

    const formattedTag = `#${trimmed}`;
    handleToggleHashtag(formattedTag);
    setCustomTagInput("");
  };

  // Apply AI Hook Preset
  const handleApplyPreset = (preset: AiHookPreset) => {
    setSelectedHookKey(preset.key);
    onChangeCaption(preset.content);
  };

  const handleCopyCaption = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(caption);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const handleClearCaption = () => {
    if (caption.trim() && confirm("Are you sure you want to clear the entire caption?")) {
      onChangeCaption("");
      setSelectedHookKey(null);
    }
  };

  // Filtered hashtags
  const currentCategoryTags =
    activeCategory === "All"
      ? hashtagCategories.flatMap((c) => c.tags)
      : hashtagCategories.find((c) => c.name === activeCategory)?.tags || [];

  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm border border-outline-variant/20">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-secondary">
            edit_note
          </span>
          <h2 className="text-sm font-semibold text-on-surface">
            Caption &amp; Copy Studio
          </h2>
        </div>

        {/* Telemetry Multi-Metric Counter Chips */}
        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
            {wordCount} words
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              hashtagCount > maxHashtags
                ? "bg-error/20 text-error"
                : "bg-surface-container text-secondary"
            }`}
          >
            {hashtagCount}/{maxHashtags} tags
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              mentionCount > maxMentions
                ? "bg-error/20 text-error"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {mentionCount}/{maxMentions} mentions
          </span>
        </div>
      </div>

      {/* Progress Bar for Character Counter */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-on-surface-variant font-medium">
            Character Limit Progress (Instagram 2,200)
          </span>
          <span
            className={`font-semibold ${
              isCharOverLimit
                ? "text-error"
                : isCharWarning
                ? "text-amber-400"
                : "text-on-surface-variant"
            }`}
          >
            {charCount.toLocaleString()} / {maxChars.toLocaleString()} chars
            {isCharOverLimit && ` (+${charCount - maxChars} chars over limit)`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
          <div
            className={`h-full transition-all duration-300 ${
              isCharOverLimit
                ? "bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                : isCharWarning
                ? "bg-amber-400"
                : "bg-primary"
            }`}
            style={{ width: `${charPercent}%` }}
          />
        </div>
      </div>

      {/* 5 Creator AI Hook Presets Suite */}
      <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-r from-surface-container via-surface-container-high to-surface-container p-3 border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              auto_awesome
            </span>
            <span className="text-xs font-semibold text-on-surface">
              Creator AI Hook Presets (Phase 4 Tones)
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant">
            Click any preset to apply
          </span>
        </div>

        {/* 5 Preset Cards / Buttons */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {aiHookPresets.map((preset) => {
            const isSelected = selectedHookKey === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                title={preset.description}
                className={`flex flex-col items-start gap-1 rounded-lg p-2 text-left transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-md ring-1 ring-primary-container"
                    : "bg-surface-container-lowest text-on-surface hover:bg-surface-variant"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span className="material-symbols-outlined text-[15px]">
                      {preset.icon}
                    </span>
                    <span>{preset.label}</span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[13px]">
                      check_circle
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] truncate max-w-full ${
                    isSelected ? "text-white/80" : "text-on-surface-variant"
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Textarea Canvas */}
      <div className="relative flex flex-col rounded-xl bg-surface-container-lowest p-3 border border-outline-variant/30 focus-within:border-primary/60 transition-colors shadow-inner">
        <textarea
          ref={textareaRef}
          rows={6}
          value={caption}
          onChange={(e) => onChangeCaption(e.target.value)}
          placeholder="Write your high-impact caption... Share the story, hook, or context behind this visual release."
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-on-surface placeholder:text-outline focus:outline-none"
        />

        {/* 1-Click Popular Social Emojis Strip */}
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-surface-container-low pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mr-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">
              sentiment_satisfied
            </span>
            <span>1-Click Emojis:</span>
          </span>
          {popularEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleInsertEmoji(emoji)}
              title={`Insert ${emoji} at cursor`}
              className="flex h-6 w-6 items-center justify-center rounded text-sm transition-colors hover:bg-surface-container active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Formatting Helpers Toolbar Strip */}
        <div className="mt-space-xs flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-low pt-space-xs text-on-surface-variant">
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Bold selection (**text**)"
              onClick={() => insertAtCursor("**", "**", "bold")}
              className="flex items-center gap-0.5 rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                format_bold
              </span>
              <span className="hidden sm:inline text-[10px] font-bold">Bold</span>
            </button>
            <button
              type="button"
              title="Italic selection (_text_)"
              onClick={() => insertAtCursor("_", "_", "italic")}
              className="flex items-center gap-0.5 rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                format_italic
              </span>
              <span className="hidden sm:inline text-[10px] italic">Italic</span>
            </button>
            <button
              type="button"
              title="Add bullet point (•)"
              onClick={() => insertAtCursor("\n• ", "", "Key insight")}
              className="flex items-center gap-0.5 rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                format_list_bulleted
              </span>
              <span className="hidden sm:inline text-[10px]">Bullet</span>
            </button>
            <button
              type="button"
              title="Add numbered list item"
              onClick={() => insertAtCursor("\n1. ", "", "Step one")}
              className="flex items-center gap-0.5 rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                format_list_numbered
              </span>
              <span className="hidden sm:inline text-[10px]">Number</span>
            </button>
            <button
              type="button"
              title="Add aesthetic divider line"
              onClick={() => insertAtCursor("\n──────────\n")}
              className="flex items-center gap-0.5 rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                horizontal_rule
              </span>
              <span className="hidden sm:inline text-[10px]">Divider</span>
            </button>
            <button
              type="button"
              title="Insert Mention (@)"
              onClick={() => insertAtCursor("@")}
              className="flex items-center gap-0.5 rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                alternate_email
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {copiedNotification && (
              <span className="text-[10px] text-emerald-400 font-semibold ">
                Copied to clipboard!
              </span>
            )}
            <button
              type="button"
              onClick={handleCopyCaption}
              className="flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-secondary transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[14px]">
                content_copy
              </span>
              <span>Copy</span>
            </button>
            {caption.trim() && (
              <button
                type="button"
                onClick={handleClearCaption}
                title="Clear caption"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-error transition-colors hover:bg-error-container/20"
              >
                <span className="material-symbols-outlined text-[14px]">
                  clear_all
                </span>
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hashtag Hub Section */}
      <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest/50 p-space-sm border border-outline-variant/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              tag
            </span>
            <span>Hashtag Hub</span>
            <span className="text-[10px] text-on-surface-variant">
              (Click to add/remove)
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-surface-container p-0.5">
            {["All", "Design & Creative", "Strategy & SaaS", "Growth & Engagement"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-surface-container-high text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {cat.split(" ")[0]}
                </button>
              )
            )}
          </div>
        </div>

        {/* Custom Hashtag Input Row */}
        <form onSubmit={handleAddCustomTag} className="flex items-center gap-2 mt-1">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-bold">
              #
            </span>
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              placeholder="Add custom hashtag (e.g. brandcampaign)..."
              className="w-full rounded-lg bg-surface-container px-6 py-1.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={!customTagInput.trim()}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-40 hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            <span>Add</span>
          </button>
        </form>

        {/* Hashtag Chips Strip */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {currentCategoryTags.map((tag) => {
            const isAttached = extractedHashtags.includes(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleHashtag(tag)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-all ${
                  isAttached
                    ? "bg-primary/20 font-semibold text-primary border border-primary/40 shadow-xs"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                }`}
              >
                <span>{tag}</span>
                <span className="material-symbols-outlined text-[12px]">
                  {isAttached ? "done" : "add"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
