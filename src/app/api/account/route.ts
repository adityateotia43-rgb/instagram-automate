import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoMode, getMockAccount } from "@/lib/demo";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, "account-get", { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    if (isDemoMode()) {
      const res = NextResponse.json({
        account: getMockAccount(),
        isDemo: true,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        rateLimitResult
      );
    }

    const account = await prisma.instagramAccount.findFirst({
      where: { userId, isActive: true },
      include: {
        oauthToken: {
          select: {
            expiresAt: true,
            isValid: true,
          },
        },
      },
    });

    if (!account) {
      const res = NextResponse.json({
        account: getMockAccount(),
        isDemo: true,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    const res = NextResponse.json({
      account,
      isDemo: false,
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (error: unknown) {
    console.warn("[AccountAPI] Error fetching account:", error);
    return NextResponse.json({
      account: getMockAccount(),
      isDemo: true,
    });
  }
}
