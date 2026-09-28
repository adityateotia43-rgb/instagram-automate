import { NextRequest, NextResponse } from "next/server";
import { executePublishingQueue, QueueRunOptions } from "@/lib/queue/publisher";
import {
  getMockPublishingAttempts,
  getMockScheduledPosts,
  isDemoMode,
} from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateCsrfOrigin, createCsrfForbiddenResponse } from "@/lib/csrf";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

const queueOptionsSchema = z.object({
  simulateMode: z.enum(["RANDOM", "FORCE_SUCCESS", "FORCE_FAILURE", "REAL_API"]).optional(),
  failureRate: z.number().min(0).max(1).optional(),
  includeFuturePending: z.boolean().optional(),
  forceRealApi: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, "queue-get", { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    if (isDemoMode()) {
      const scheduled = getMockScheduledPosts();
      const attempts = getMockPublishingAttempts();

      const pending = scheduled.filter((s) => s.status === "PENDING").length;
      const completed = scheduled.filter((s) => s.status === "COMPLETED").length;
      const failed = scheduled.filter((s) => s.status === "FAILED").length;

      const res = NextResponse.json({
        success: true,
        mode: "DEMO",
        queue: {
          totalScheduled: scheduled.length,
          pending,
          completed,
          failed,
          activeWorker: true,
          pollInterval: "60s",
        },
        recentAttempts: attempts.slice(0, 15),
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    try {
      const [pendingCount, attempts] = await Promise.all([
        prisma.scheduledPost.count({ where: { status: "PENDING" } }),
        prisma.publishingAttempt.findMany({
          orderBy: { startedAt: "desc" },
          take: 15,
        }),
      ]);

      const res = NextResponse.json({
        success: true,
        mode: "DATABASE",
        queue: {
          pending: pendingCount,
          activeWorker: true,
        },
        recentAttempts: attempts,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    } catch {
      const res = NextResponse.json({
        success: true,
        mode: "DEMO_FALLBACK",
        recentAttempts: getMockPublishingAttempts().slice(0, 15),
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }
  } catch (error: unknown) {
    console.error("[QueueAPI] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue status" },
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

    const rateLimitResult = rateLimit(req, "queue-post", { limit: 30, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    let options: QueueRunOptions = {};
    try {
      const body = await req.json();
      const parsed = queueOptionsSchema.safeParse(body);
      if (parsed.success) {
        options = parsed.data;
      }
    } catch {
      // Empty or non-JSON body: use defaults
    }

    const result = await executePublishingQueue(options);
    const res = NextResponse.json(result);
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (error: unknown) {
    console.error("[QueueAPI] POST Error:", error);
    return NextResponse.json(
      { error: "Job queue execution failed" },
      { status: 500 }
    );
  }
}
