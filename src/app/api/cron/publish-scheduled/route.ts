import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executePublishingQueue } from "@/lib/queue/publisher";
import { isDemoMode } from "@/lib/demo";
import { validateCsrfOrigin, createCsrfForbiddenResponse } from "@/lib/csrf";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const csrfCheck = validateCsrfOrigin(req);
  if (!csrfCheck.valid) {
    return createCsrfForbiddenResponse(csrfCheck.reason);
  }
  return handleScheduledWorker(req);
}

export async function GET(req: NextRequest) {
  return handleScheduledWorker(req);
}

async function handleScheduledWorker(req: NextRequest) {
  const rateLimitResult = rateLimit(req, "cron-publish", { limit: 60, windowMs: 60 * 1000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const hasValidBearer = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  // In non-demo mode, enforce strict authentication (Bearer token or logged-in session)
  if (!isDemoMode()) {
    if (!hasValidBearer) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return attachRateLimitHeaders(
          NextResponse.json({ error: "Unauthorized: Invalid or missing authentication credentials." }, { status: 401 }),
          rateLimitResult
        );
      }
    }
  }

  let simulateMode: "RANDOM" | "FORCE_SUCCESS" | "FORCE_FAILURE" | "REAL_API" | undefined;
  let failureRate: number | undefined;
  let forceRealApi = false;

  const url = new URL(req.url);
  const modeParam = url.searchParams.get("mode");
  if (
    modeParam === "FORCE_SUCCESS" ||
    modeParam === "FORCE_FAILURE" ||
    modeParam === "RANDOM" ||
    modeParam === "REAL_API"
  ) {
    simulateMode = modeParam;
  }
  if (url.searchParams.get("forceReal") === "true") {
    forceRealApi = true;
  }
  const failRateParam = url.searchParams.get("failureRate");
  if (failRateParam) {
    const parsedRate = parseFloat(failRateParam);
    if (!isNaN(parsedRate)) failureRate = parsedRate;
  }

  try {
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.simulateMode) simulateMode = body.simulateMode;
        if (typeof body.failureRate === "number") failureRate = body.failureRate;
        if (body.forceRealApi) forceRealApi = Boolean(body.forceRealApi);
      } catch {
        // Body might be empty
      }
    }
  } catch {
    // Ignore body parse errors
  }

  const result = await executePublishingQueue({
    simulateMode: simulateMode || "RANDOM",
    failureRate: failureRate !== undefined ? failureRate : 0.25,
    includeFuturePending: true,
    forceRealApi,
  });

  const res = NextResponse.json(result);
  return attachRateLimitHeaders(res, rateLimitResult);
}
