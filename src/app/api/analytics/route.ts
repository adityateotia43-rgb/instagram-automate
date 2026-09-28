export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, getMockAnalytics } from "@/lib/demo";
import { instagramClient } from "@/lib/instagram/client";
import { resolvePublishingCredentials } from "@/lib/queue/publisher";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, "analytics-get", { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(req.url);
    const forceReal = searchParams.get("forceReal") === "true";
    const forceDemo = searchParams.get("forceDemo") === "true";

    const shouldUseDemo = forceDemo || (isDemoMode() && !forceReal);

    // If Demo Mode is active and not forcing real API, return simulated metrics
    if (shouldUseDemo) {
      const mockAnalytics = getMockAnalytics();
      const res = NextResponse.json({
        success: true,
        isDemo: true,
        source: "DEMO_SANDBOX",
        analytics: mockAnalytics,
        metricsAvailability: [
          {
            metric: "reach",
            label: "Audience Reach (Unique Accounts)",
            isAvailable: true,
            statusText: "Simulated in Demo Mode",
          },
          {
            metric: "total_interactions",
            label: "Engagement / Total Interactions",
            isAvailable: true,
            statusText: "Simulated in Demo Mode",
          },
          {
            metric: "impressions",
            label: "Impressions",
            isAvailable: true,
            statusText: "Simulated in Demo Mode",
          },
          {
            metric: "likes_and_comments",
            label: "Likes & Comments",
            isAvailable: true,
            statusText: "Simulated in Demo Mode",
          },
          {
            metric: "saved_and_shares",
            label: "Saves & Shares",
            isAvailable: true,
            statusText: "Simulated in Demo Mode",
          },
        ],
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    const creds = await resolvePublishingCredentials();

    if (creds.isReal) {
      try {
        const liveAnalytics = await instagramClient.getAggregatedAnalytics(
          creds.accessToken,
          creds.instagramAccountId
        );

        const res = NextResponse.json({
          success: true,
          isDemo: false,
          source: "META_GRAPH_API",
          analytics: liveAnalytics,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      } catch (err: unknown) {
        console.warn("[AnalyticsAPI] Live fetch failed, falling back to mock:", err);
      }
    }

    // Fallback to mock data if credentials are not configured or DB is unseeded
    const fallbackAnalytics = getMockAnalytics();
    const res = NextResponse.json({
      success: true,
      isDemo: true,
      source: "DEMO_FALLBACK",
      analytics: fallbackAnalytics,
      notice: "Live Instagram credentials unavailable. Displaying demo sandbox data.",
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (error: unknown) {
    console.error("[AnalyticsAPI] Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
