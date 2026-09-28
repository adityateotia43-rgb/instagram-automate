/**
 * User-Friendly Error Handling & Categorization System for Insta Automate
 *
 * Translates complex Meta Graph API codes, OAuth exceptions, media processing
 * errors, network failures, and schedule validations into polite, actionable
 * user-facing messages.
 */

export type ErrorCategory =
  | "INVALID_MEDIA"
  | "UNSUPPORTED_FORMAT"
  | "RATE_LIMITED"
  | "EXPIRED_TOKEN"
  | "PERMISSION_ERROR"
  | "NETWORK_FAILURE"
  | "DUPLICATE_PUBLISH"
  | "INVALID_SCHEDULE_TIME"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR";

export interface UserFacingErrorInfo {
  category: ErrorCategory;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  retryable: boolean;
  technicalDetails?: string;
}

/**
 * Standard user-facing error response container
 */
export class UserFacingError extends Error {
  public info: UserFacingErrorInfo;

  constructor(info: UserFacingErrorInfo) {
    super(info.message);
    this.name = "UserFacingError";
    this.info = info;
  }

  get category(): ErrorCategory {
    return this.info.category;
  }

  get userMessage(): string {
    return this.info.message;
  }

  get actionLabel(): string | undefined {
    return this.info.actionLabel;
  }

  get actionUrl(): string | undefined {
    return this.info.actionUrl;
  }

  get retryable(): boolean {
    return this.info.retryable;
  }
}

/**
 * Translate Meta Graph API, OAuth, network, and database errors into
 * actionable, friendly user messages.
 */
export function formatApiError(error: unknown): UserFacingErrorInfo {
  if (error instanceof UserFacingError) {
    return error.info;
  }

  const err = error as Record<string, unknown> | null;
  const message = (err?.message as string) || (typeof error === "string" ? error : "");
  const code = (err?.code as number | undefined) || 0;
  const subcode = (err?.subcode as number | undefined) || (err?.error_subcode as number | undefined);

  // 1. EXPIRED OR INVALID ACCESS TOKEN
  // Meta codes: 190 (Invalid OAuth access token), 102 (Session invalid)
  // Subcodes: 463 (expired), 467 (expired), 458 (deauthorized), 460 (password changed), 490 (checkpoint)
  if (
    code === 190 ||
    code === 102 ||
    code === 401 ||
    subcode === 463 ||
    subcode === 467 ||
    subcode === 458 ||
    subcode === 460 ||
    /token has expired|session has expired|invalid oauth|session is invalid/i.test(message)
  ) {
    return {
      category: "EXPIRED_TOKEN",
      title: "Instagram Session Expired",
      message:
        "Your Instagram connection session has expired. To continue publishing and viewing analytics, please reconnect your account in Settings.",
      actionLabel: "Reconnect Instagram Account",
      actionUrl: "/dashboard/settings",
      retryable: false,
      technicalDetails: `Meta Error Code ${code}${subcode ? `:${subcode}` : ""}`,
    };
  }

  // 2. PERMISSION AND SCOPE ERRORS
  // Meta codes: 10 (permission denied), 200-299 (permissions error)
  // Subcode: 459 (user has not accepted TOS), 464 (capability not allowed)
  if (
    code === 10 ||
    (code >= 200 && code <= 299) ||
    subcode === 459 ||
    subcode === 464 ||
    /permission|unauthorized|not authorized|requires the.*permission|instagram_content_publish/i.test(message)
  ) {
    return {
      category: "PERMISSION_ERROR",
      title: "Permissions Needed",
      message:
        "Your account is missing required Instagram permissions (e.g. Content Publishing or Insights). Please reconnect your account and make sure all permissions are granted.",
      actionLabel: "Review Account Permissions",
      actionUrl: "/dashboard/settings",
      retryable: false,
      technicalDetails: `Permission Code ${code}${subcode ? `:${subcode}` : ""}`,
    };
  }

  // 3. API RATE LIMITING
  // Meta codes: 4 (App rate limit), 17 (User rate limit), 32 (Page rate limit), 613 (Calls exceeded)
  // HTTP status 429
  if (
    code === 4 ||
    code === 17 ||
    code === 32 ||
    code === 613 ||
    code === 429 ||
    /rate limit|too many requests|calls to this api have exceeded/i.test(message)
  ) {
    return {
      category: "RATE_LIMITED",
      title: "Instagram Rate Limit Reached",
      message:
        "You have reached Instagram's API rate limit. Meta limits requests to protect your account. Please wait 15–30 minutes before trying again.",
      actionLabel: "View Activity Status",
      actionUrl: "/dashboard/activity",
      retryable: true,
      technicalDetails: `Rate Limit Code ${code}`,
    };
  }

  // 4. INVALID MEDIA & ASPECT RATIO
  // Meta error codes:
  // 36003: Aspect ratio not allowed (must be between 4:5 and 1.91:1)
  // 36001: Invalid media url or cannot fetch
  // 2207001-2207026: Container / Video encoding / bitrate / duration issues
  if (
    code === 36003 ||
    code === 36001 ||
    (code >= 2207000 && code <= 2207030) ||
    /aspect ratio|media invalid|cannot fetch media|video length|duration|bitrate/i.test(message)
  ) {
    let customMsg =
      "The uploaded media does not meet Instagram's technical requirements. Photos must have an aspect ratio between 4:5 (portrait) and 1.91:1 (landscape).";

    if (/video|duration|length/i.test(message) || (code >= 2207001 && code <= 2207005)) {
      customMsg =
        "Video duration or encoding is invalid. Videos must be between 3 seconds and 15 minutes in length, formatted as MP4 (H.264) with AAC audio.";
    }

    return {
      category: "INVALID_MEDIA",
      title: "Media Formatting Notice",
      message: customMsg,
      actionLabel: "Adjust Media in Studio",
      retryable: true,
      technicalDetails: message || `Media Code ${code}`,
    };
  }

  // 5. UNSUPPORTED FORMATS
  if (/unsupported file format|unsupported media|mime type|invalid format/i.test(message)) {
    return {
      category: "UNSUPPORTED_FORMAT",
      title: "Unsupported Media Format",
      message:
        "This file format is not supported by Instagram. Please upload JPG, PNG, or WEBP images, or MP4 / MOV videos.",
      actionLabel: "Choose Another File",
      retryable: true,
      technicalDetails: message,
    };
  }

  // 6. NETWORK FAILURES & TIMEOUTS
  if (
    code === 0 ||
    /fetch failed|network|econnrefused|enotfound|etimedout|abort|timeout|offline/i.test(message)
  ) {
    return {
      category: "NETWORK_FAILURE",
      title: "Connection Trouble",
      message:
        "Unable to connect to the Instagram servers. Please check your internet connection and try again.",
      actionLabel: "Retry Action",
      retryable: true,
      technicalDetails: message,
    };
  }

  // 7. DUPLICATE PUBLISH ATTEMPTS
  if (/duplicate|already published|identical post/i.test(message)) {
    return {
      category: "DUPLICATE_PUBLISH",
      title: "Duplicate Post Detected",
      message:
        "An identical post was published recently. To prevent accidental duplicates on your Instagram feed, please wait a couple of minutes or modify your caption.",
      actionLabel: "Review Feed",
      actionUrl: "/dashboard",
      retryable: false,
      technicalDetails: message,
    };
  }

  // 8. INVALID SCHEDULING TIME
  if (/schedule|scheduled time|publish time|in the past/i.test(message)) {
    return {
      category: "INVALID_SCHEDULE_TIME",
      title: "Invalid Schedule Time",
      message:
        message.length > 10 && !message.includes("Error")
          ? message
          : "Please choose a future time at least 10 minutes in advance and within the next 75 days.",
      actionLabel: "Adjust Schedule",
      retryable: true,
      technicalDetails: message,
    };
  }

  // Default fallback for general server or unexpected errors
  return {
    category: "SERVER_ERROR",
    title: "Action Could Not Be Completed",
    message:
      message && !message.includes("Object") && !message.includes("Error:")
        ? message
        : "An unexpected error occurred while processing your request. Please try again or check Settings.",
    actionLabel: "Check Settings",
    actionUrl: "/dashboard/settings",
    retryable: true,
    technicalDetails: message,
  };
}

/**
 * Validate scheduling date and time bounds according to Instagram's official
 * requirements:
 * 1. Must be in the future
 * 2. Must be at least 10 minutes from now (allows container prep and sync)
 * 3. Must be at most 75 days in advance (Meta maximum API limit)
 */
export function validateScheduleTime(
  publishDate?: string,
  publishTime?: string
): { valid: boolean; error?: UserFacingErrorInfo; scheduledDate?: Date } {
  if (!publishDate || !publishTime) {
    return {
      valid: false,
      error: {
        category: "INVALID_SCHEDULE_TIME",
        title: "Missing Schedule Time",
        message: "Please choose both a publish date and time for your scheduled post.",
        actionLabel: "Select Date & Time",
        retryable: true,
      },
    };
  }

  const dateString = `${publishDate}T${publishTime}`;
  const scheduledDate = new Date(dateString);

  if (isNaN(scheduledDate.getTime())) {
    return {
      valid: false,
      error: {
        category: "INVALID_SCHEDULE_TIME",
        title: "Invalid Date Format",
        message: "The chosen date or time could not be parsed. Please select a valid date.",
        actionLabel: "Fix Schedule",
        retryable: true,
      },
    };
  }

  const now = Date.now();
  const targetTime = scheduledDate.getTime();
  const diffMs = targetTime - now;

  // Check 1: In the past
  if (diffMs <= 0) {
    return {
      valid: false,
      error: {
        category: "INVALID_SCHEDULE_TIME",
        title: "Schedule Time In Past",
        message: "The selected time has already passed. Please choose a future date and time.",
        actionLabel: "Pick Future Time",
        retryable: true,
      },
    };
  }

  // Check 2: Minimum 10 minutes in advance
  const minLeadMs = 10 * 60 * 1000;
  if (diffMs < minLeadMs) {
    const minutesAway = Math.max(0, Math.round(diffMs / 60000));
    return {
      valid: false,
      error: {
        category: "INVALID_SCHEDULE_TIME",
        title: "Need More Lead Time",
        message: `Instagram requires scheduled posts to be at least 10 minutes in the future (selected time is only ${minutesAway} min${minutesAway === 1 ? "" : "s"} away).`,
        actionLabel: "Set 15+ Min Ahead",
        retryable: true,
      },
    };
  }

  // Check 3: Maximum 75 days in advance (Instagram Graph API limit)
  const maxAdvanceMs = 75 * 24 * 60 * 60 * 1000;
  if (diffMs > maxAdvanceMs) {
    return {
      valid: false,
      error: {
        category: "INVALID_SCHEDULE_TIME",
        title: "Schedule Too Far Ahead",
        message: "Instagram supports scheduling up to 75 days in advance. Please choose a date within the next 75 days.",
        actionLabel: "Pick Earlier Date",
        retryable: true,
      },
    };
  }

  return {
    valid: true,
    scheduledDate,
  };
}

/**
 * Server-side in-memory deduplication store to prevent accidental double-publishing
 * (e.g. rapid double clicks or concurrent requests with identical content).
 */
interface PublishDeduplicationRecord {
  signature: string;
  userId: string;
  timestamp: number;
}

const recentPublishes: PublishDeduplicationRecord[] = [];
const DEDUPLICATION_WINDOW_MS = 60 * 1000; // 60 seconds

/**
 * Generates a stable signature for a post based on its core content.
 */
export function generatePostSignature(
  mediaUrls: string[],
  caption: string,
  accountId?: string
): string {
  const normMedia = mediaUrls.map((u) => u.trim()).sort().join("|");
  const normCaption = (caption || "").trim().toLowerCase();
  const acc = accountId || "default";
  return `${acc}::${normMedia}::${normCaption}`;
}

/**
 * Checks if an identical post was submitted within the deduplication window.
 * Returns true if duplicate is detected, false otherwise.
 */
export function checkAndRecordDuplicatePublish(
  userId: string,
  signature: string
): { isDuplicate: boolean; secondsAgo?: number } {
  const now = Date.now();

  // Prune entries older than window
  while (recentPublishes.length > 0 && now - recentPublishes[0].timestamp > DEDUPLICATION_WINDOW_MS) {
    recentPublishes.shift();
  }

  const existing = recentPublishes.find(
    (r) => r.userId === userId && r.signature === signature
  );

  if (existing) {
    const secondsAgo = Math.max(1, Math.round((now - existing.timestamp) / 1000));
    return { isDuplicate: true, secondsAgo };
  }

  recentPublishes.push({
    signature,
    userId,
    timestamp: now,
  });

  return { isDuplicate: false };
}