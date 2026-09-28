import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isDemoMode,
  getMockSettings,
  updateMockSettings,
  refreshMockToken,
  addMockNotification,
} from "@/lib/demo";
import { z } from "zod";
import { validateCsrfOrigin, createCsrfForbiddenResponse } from "@/lib/csrf";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

const settingsPatchSchema = z
  .object({
    autoFirstComment: z.boolean().optional(),
    firstCommentTemplate: z.string().max(2200).optional(),
    defaultRatio: z.enum(["1:1", "4:5", "16:9"]).optional(),
    defaultTimezone: z.string().max(100).optional(),
    shareToFacebook: z.boolean().optional(),
    autoHashtagsInComment: z.boolean().optional(),
    hideLikeCount: z.boolean().optional(),
    disableComments: z.boolean().optional(),
    metaAppId: z.string().max(100).optional(),
    metaAppSecret: z.string().max(100).optional(),
  })
  .strict();

const settingsActionSchema = z.object({
  action: z.enum(["refresh_token"]),
});

function sanitizeSettings<T extends Record<string, unknown>>(
  settings: T
): Omit<T, "metaAppSecret"> & { hasMetaAppSecret: boolean } {
  const sanitized = { ...settings };
  const hasSecret = Boolean(sanitized.metaAppSecret);
  delete sanitized.metaAppSecret;
  return {
    ...sanitized,
    hasMetaAppSecret: hasSecret,
  };
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, "settings-get", { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const session = await getServerSession(authOptions);

    if (isDemoMode() || !session) {
      const settings = getMockSettings();
      const res = NextResponse.json({
        success: true,
        settings: sanitizeSettings(settings as unknown as Record<string, unknown>),
        isDemo: true,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    const settings = getMockSettings();
    const res = NextResponse.json({
      success: true,
      settings: sanitizeSettings(settings as unknown as Record<string, unknown>),
      isDemo: false,
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (err: unknown) {
    console.error("[SettingsAPI] Error reading settings:", err);
    return NextResponse.json(
      {
        error: "Failed to load settings",
        settings: sanitizeSettings(getMockSettings() as unknown as Record<string, unknown>),
        isDemo: true,
      },
      { status: 200 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(req, "settings-patch", { limit: 30, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 }),
        rateLimitResult
      );
    }

    const parsed = settingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return attachRateLimitHeaders(
        NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        ),
        rateLimitResult
      );
    }

    const updated = updateMockSettings(parsed.data);
    const res = NextResponse.json({
      success: true,
      message: isDemoMode()
        ? "Settings updated successfully! (Demo Mode)"
        : "Settings updated successfully!",
      settings: sanitizeSettings(updated as unknown as Record<string, unknown>),
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (err: unknown) {
    console.error("[SettingsAPI] Error saving settings:", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(req, "settings-post", { limit: 15, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 }),
        rateLimitResult
      );
    }

    const parsed = settingsActionSchema.safeParse(body);
    if (!parsed.success) {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Invalid action specified" }, { status: 400 }),
        rateLimitResult
      );
    }

    if (parsed.data.action === "refresh_token") {
      const result = refreshMockToken();

      addMockNotification({
        type: "SYSTEM",
        title: "Meta Long-Lived Token Refreshed",
        message: "OAuth token lifespan successfully extended by 60 days.",
        link: "/dashboard/settings",
      });

      const res = NextResponse.json({
        success: true,
        message: "Meta long-lived access token refreshed for 60 days!",
        tokenDaysLeft: result.tokenDaysLeft,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    return attachRateLimitHeaders(
      NextResponse.json({ error: "Unsupported action" }, { status: 400 }),
      rateLimitResult
    );
  } catch (err: unknown) {
    console.error("[SettingsAPI] Error handling action:", err);
    return NextResponse.json(
      { error: "Failed to process settings action" },
      { status: 500 }
    );
  }
}
