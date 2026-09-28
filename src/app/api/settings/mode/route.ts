import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, setRuntimeDemoMode } from "@/lib/demo";
import { z } from "zod";
import { validateCsrfOrigin, createCsrfForbiddenResponse } from "@/lib/csrf";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const modeSchema = z.object({
  demoMode: z.boolean(),
});

export async function GET(req: NextRequest) {
  const rateLimitResult = rateLimit(req, "settings-mode-get", { limit: 60, windowMs: 60 * 1000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const res = NextResponse.json({
    isDemo: isDemoMode(),
    demoModeEnv: process.env.DEMO_MODE || "false",
    metaAppId: process.env.META_APP_ID || null,
  });
  return attachRateLimitHeaders(res, rateLimitResult);
}

export async function POST(req: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(req, "settings-mode-post", { limit: 20, windowMs: 60 * 1000 });
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

    const parsed = modeSchema.safeParse(body);
    if (!parsed.success) {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Invalid payload: 'demoMode' boolean is required." }, { status: 400 }),
        rateLimitResult
      );
    }

    const targetMode = parsed.data.demoMode;
    setRuntimeDemoMode(targetMode);

    const res = NextResponse.json({
      success: true,
      isDemo: isDemoMode(),
      message: targetMode
        ? "Switched to DEMO MODE (Simulated Sandbox)"
        : "Switched to REAL API MODE (Live Meta Graph API)",
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch {
    return NextResponse.json(
      { error: "Failed to update application mode" },
      { status: 400 }
    );
  }
}
