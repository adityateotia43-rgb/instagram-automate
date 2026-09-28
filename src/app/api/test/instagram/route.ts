import { NextRequest, NextResponse } from "next/server";
import { instagramClient, InstagramApiError } from "@/lib/instagram/client";
import { checkInstagramConfigStatus } from "@/lib/instagram/config";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rateLimitResult = rateLimit(req, "test-instagram", { limit: 15, windowMs: 60 * 1000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const configStatus = checkInstagramConfigStatus();

  try {
    const profile = await instagramClient.getProfile();

    const res = NextResponse.json({
      success: true,
      message: `Successfully connected to Instagram as @${profile.username}`,
      profile: {
        id: profile.id,
        username: profile.username,
        account_type: profile.account_type || "Not specified",
        media_count: profile.media_count ?? 0,
      },
      environment: {
        isConfigured: configStatus.isConfigured,
        isDemo: configStatus.isDemo,
      },
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (err: unknown) {
    if (err instanceof InstagramApiError) {
      const res = NextResponse.json(
        {
          success: false,
          error: err.message,
          friendlyMessage: err.getFriendlyMessage(),
          code: err.code,
          subcode: err.subcode,
          isAuthError: err.isAuthError,
          isRateLimit: err.isRateLimit,
          isNetworkError: err.isNetworkError,
          environment: configStatus,
        },
        { status: err.isAuthError ? 401 : err.isRateLimit ? 429 : 500 }
      );
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    const message = err instanceof Error ? err.message : "Unknown error connecting to Instagram";
    const res = NextResponse.json(
      {
        success: false,
        error: message,
        environment: configStatus,
      },
      { status: 500 }
    );
    return attachRateLimitHeaders(res, rateLimitResult);
  }
}
