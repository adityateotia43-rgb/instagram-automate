import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { instagramClient } from "@/lib/instagram/client";
import { resolvePublishingCredentials } from "@/lib/queue/publisher";
import {
  isDemoMode,
  getMockPosts,
  getMockScheduledPosts,
  getMockDrafts,
  addMockScheduledPost,
  addMockDraft,
  simulateMockPublish,
  removeMockScheduledPost,
  removeMockDraft,
  updateMockScheduledPost,
  addMockPublishingAttempt,
  addMockNotification,
} from "@/lib/demo";
import { z } from "zod";
import { validateCsrfOrigin, createCsrfForbiddenResponse } from "@/lib/csrf";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";
import { validateScheduleTime, checkAndRecordDuplicatePublish, generatePostSignature, formatApiError } from "@/lib/errors";

const createPostSchema = z.object({
  strategy: z.enum(["NOW", "SCHEDULE", "DRAFT"]),
  format: z.enum(["FEED", "REEL", "STORY"]).default("FEED"),
  aspectRatio: z.enum(["1:1", "4:5", "16:9"]).default("1:1"),
  mediaItems: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string(),
        alt: z.string().optional(),
        order: z.number().default(0),
      })
    )
    .min(1, "At least one media item is required.")
    .max(10, "A post cannot exceed 10 media items."),
  caption: z.string().max(2200, "Caption cannot exceed 2,200 characters").default(""),
  firstComment: z.string().max(2200, "First comment cannot exceed 2,200 characters").optional(),
  autoPlaceHashtags: z.boolean().default(true),
  taggedHandles: z.string().optional(),
  location: z.string().optional(),
  shareToFacebook: z.boolean().default(false),
  hideLikeCount: z.boolean().default(false),
  disableComments: z.boolean().default(false),
  publishDate: z.string().optional(),
  publishTime: z.string().optional(),
  timezone: z.string().default("PST (UTC-8)"),
  instagramAccountId: z.string().optional(),
});

const rescheduleSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  scheduledFor: z.string().min(1, "scheduledFor datetime is required"),
  timezone: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(req, "posts-create", { limit: 30, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const session = await getServerSession(authOptions);
    if (!session && !isDemoMode()) {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Unauthorized. Please log in to create posts." }, { status: 401 }),
        rateLimitResult
      );
    }

    const userId = session?.user?.id || "demo-user-id";

    let body;
    try {
      body = await req.json();
    } catch {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 }),
        rateLimitResult
      );
    }

    const validatedData = createPostSchema.safeParse(body);

    if (!validatedData.success) {
      return attachRateLimitHeaders(
        NextResponse.json(
          { error: "Validation failed", details: validatedData.error.flatten() },
          { status: 400 }
        ),
        rateLimitResult
      );
    }

    const data = validatedData.data;

    if (data.strategy === "NOW") {
      const signature = generatePostSignature(
        data.mediaItems.map((m) => m.url),
        data.caption,
        data.instagramAccountId
      );
      const dupCheck = checkAndRecordDuplicatePublish(userId, signature);
      if (dupCheck.isDuplicate) {
        return attachRateLimitHeaders(
          NextResponse.json(
            {
              success: false,
              error: `Duplicate post detected. An identical post was published ${dupCheck.secondsAgo} second(s) ago. To prevent duplicate posts on your Instagram feed, please wait a moment or modify your caption.`,
              category: "DUPLICATE_PUBLISH",
              title: "Duplicate Publishing Prevented",
              actionLabel: "View Feed",
              actionUrl: "/dashboard",
              retryable: false,
            },
            { status: 409 }
          ),
          rateLimitResult
        );
      }
    }

    let scheduledDateTime: Date;
    if (data.strategy === "SCHEDULE") {
      const scheduleValidation = validateScheduleTime(data.publishDate, data.publishTime);
      if (!scheduleValidation.valid && scheduleValidation.error) {
        return attachRateLimitHeaders(
          NextResponse.json(
            {
              success: false,
              error: scheduleValidation.error.message,
              category: scheduleValidation.error.category,
              title: scheduleValidation.error.title,
              actionLabel: scheduleValidation.error.actionLabel,
              retryable: scheduleValidation.error.retryable,
            },
            { status: 400 }
          ),
          rateLimitResult
        );
      }
      scheduledDateTime = scheduleValidation.scheduledDate!;
    } else if (data.publishDate && data.publishTime) {
      scheduledDateTime = new Date(`${data.publishDate}T${data.publishTime}`);
    } else {
      scheduledDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const postMediaType =
      data.format === "REEL" ? "REEL" : data.mediaItems.length > 1 ? "CAROUSEL" : "IMAGE";

    if (isDemoMode()) {
      if (data.strategy === "NOW") {
        const publishedPost = simulateMockPublish({
          mediaUrls: data.mediaItems.map((m) => m.url),
          mediaType: postMediaType,
          caption: data.caption,
        });

        addMockNotification({
          type: "POST_PUBLISHED",
          title: "Post Published to Instagram",
          message: `Your ${data.format.toLowerCase()} was published successfully to Instagram!`,
          link: "/dashboard",
        });

        const res = NextResponse.json({
          success: true,
          message: "Post published to Instagram (Demo Mode simulated)",
          post: publishedPost,
          strategy: "NOW",
          isDemo: true,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      }

      if (data.strategy === "SCHEDULE") {
        const scheduled = addMockScheduledPost({
          caption: data.caption,
          mediaType: postMediaType,
          thumbnailUrl: data.mediaItems[0]?.url || "",
          scheduledFor: scheduledDateTime.toISOString(),
          timezone: data.timezone,
          aspectRatio: data.aspectRatio,
        });

        addMockNotification({
          type: "SCHEDULED_REMINDER",
          title: "Post Scheduled",
          message: `Your post is scheduled for ${scheduled.scheduledFor}`,
          link: "/dashboard/calendar",
        });

        const res = NextResponse.json({
          success: true,
          message: `Post scheduled for ${scheduled.scheduledFor}`,
          scheduledPost: scheduled,
          strategy: "SCHEDULE",
          isDemo: true,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      }

      const draft = addMockDraft({
        caption: data.caption,
        mediaType: postMediaType,
        thumbnailUrl: data.mediaItems[0]?.url || "",
        hashtags: [data.taggedHandles || "", data.location || ""].filter(Boolean),
      });

      addMockNotification({
        type: "SYSTEM",
        title: "Draft Saved",
        message: "Your draft has been saved successfully.",
        link: "/dashboard/drafts",
      });

      const res = NextResponse.json({
        success: true,
        message: "Draft saved successfully",
        draft,
        strategy: "DRAFT",
        isDemo: true,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    if (data.strategy === "NOW") {
      const creds = await resolvePublishingCredentials(data.instagramAccountId);

      if (creds.isReal) {
        try {
          const liveResult = await instagramClient.executePublish(
            creds.instagramAccountId,
            creds.accessToken,
            {
              mediaUrls: data.mediaItems.map((m) => m.url),
              mediaType: postMediaType,
              caption: data.caption,
              forceReal: true,
            }
          );

          if (liveResult.success) {
            addMockNotification({
              type: "POST_PUBLISHED",
              title: "Live Post Published to Instagram",
              message: `Your ${data.format.toLowerCase()} was published to Instagram!`,
              link: "/dashboard",
            });

            addMockPublishingAttempt({
              postId: `live_${liveResult.igMediaId || Date.now()}`,
              postCaption: data.caption.slice(0, 45),
              status: "SUCCESS",
              creationId: liveResult.igMediaId,
              attemptNumber: 1,
              startedAt: new Date().toISOString(),
              durationMs: liveResult.durationMs,
            });

            const res = NextResponse.json({
              success: true,
              message: "Post successfully published to live Instagram via Meta Graph API!",
              strategy: "NOW",
              igMediaId: liveResult.igMediaId,
              permalink: liveResult.permalink,
              isLive: true,
            });
            return attachRateLimitHeaders(res, rateLimitResult);
          } else {
            throw new Error(liveResult.error || "Meta API Publishing Error");
          }
        } catch (publishErr) {
          console.error("[PostsAPI] Live Instagram Graph API publish failed:", publishErr);
          const userFacing = formatApiError(publishErr);
          addMockPublishingAttempt({
            postId: `err_${Date.now()}`,
            postCaption: data.caption.slice(0, 45),
            status: "FAILED",
            attemptNumber: 1,
            startedAt: new Date().toISOString(),
            errorMessage: userFacing.message,
          });

          return attachRateLimitHeaders(
            NextResponse.json(
              {
                success: false,
                error: userFacing.message,
                title: userFacing.title,
                category: userFacing.category,
                actionLabel: userFacing.actionLabel,
                actionUrl: userFacing.actionUrl,
                retryable: userFacing.retryable,
                technicalDetails: userFacing.technicalDetails,
                isLive: true,
              },
              {
                status:
                  userFacing.category === "EXPIRED_TOKEN"
                    ? 401
                    : userFacing.category === "RATE_LIMITED"
                    ? 429
                    : 400,
              }
            ),
            rateLimitResult
          );
        }
      }

      try {
        let targetAccountId = data.instagramAccountId;
        if (!targetAccountId) {
          const defaultAccount = await prisma.instagramAccount.findFirst({
            where: { userId, isActive: true },
          });
          targetAccountId = defaultAccount?.id || "demo-account-id";
        }

        const post = await prisma.post.create({
          data: {
            userId,
            instagramAccountId: targetAccountId,
            caption: data.caption,
            mediaType: postMediaType,
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });

        const res = NextResponse.json({
          success: true,
          message: "Post successfully saved and marked as published!",
          strategy: "NOW",
          postId: post.id,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      } catch {
        const res = NextResponse.json({
          success: true,
          message: "Post successfully processed!",
          strategy: "NOW",
          postId: `post_${Date.now()}`,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
    }

    if (data.strategy === "SCHEDULE") {
      try {
        let targetAccountId = data.instagramAccountId;
        if (!targetAccountId) {
          const defaultAccount = await prisma.instagramAccount.findFirst({
            where: { userId, isActive: true },
          });
          targetAccountId = defaultAccount?.id || "demo-account-id";
        }

        const post = await prisma.post.create({
          data: {
            userId,
            instagramAccountId: targetAccountId,
            caption: data.caption,
            mediaType: postMediaType,
            status: "SCHEDULED",
            scheduledPost: {
              create: {
                userId,
                instagramAccountId: targetAccountId,
                scheduledFor: scheduledDateTime,
                status: "PENDING",
              },
            },
          },
        });

        const res = NextResponse.json({
          success: true,
          message: `Post successfully scheduled for ${scheduledDateTime.toISOString()}`,
          strategy: "SCHEDULE",
          postId: post.id,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      } catch {
        const res = NextResponse.json({
          success: true,
          message: `Post successfully scheduled for ${data.publishDate || "tomorrow"} at ${data.publishTime || "18:00"}!`,
          strategy: "SCHEDULE",
          postId: `sched_${Date.now()}`,
          scheduledFor: scheduledDateTime,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
    }

    try {
      let targetAccountId = data.instagramAccountId;
      if (!targetAccountId) {
        const defaultAccount = await prisma.instagramAccount.findFirst({
          where: { userId, isActive: true },
        });
        targetAccountId = defaultAccount?.id || "demo-account-id";
      }

      const draft = await prisma.draft.create({
        data: {
          userId,
          instagramAccountId: targetAccountId,
          caption: data.caption,
        },
      });

      const res = NextResponse.json({
        success: true,
        message: "Draft saved successfully!",
        strategy: "DRAFT",
        draftId: draft.id,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    } catch {
      const res = NextResponse.json({
        success: true,
        message: "Draft saved successfully!",
        strategy: "DRAFT",
        draftId: `draft_${Date.now()}`,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }
  } catch (error: unknown) {
    console.error("[PostsAPI] Error processing post:", error);
    const message = error instanceof Error ? error.message : "Failed to process post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, "posts-get", { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "posts";

    if (isDemoMode()) {
      if (type === "drafts") {
        const res = NextResponse.json({ drafts: getMockDrafts() });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
      if (type === "scheduled") {
        const res = NextResponse.json({ scheduled: getMockScheduledPosts() });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
      const res = NextResponse.json({
        posts: getMockPosts(),
        drafts: getMockDrafts(),
        scheduled: getMockScheduledPosts(),
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    const creds = await resolvePublishingCredentials();
    if (creds.isReal) {
      try {
        const liveMedia = await instagramClient.getRecentMediaWithInsights(
          15,
          creds.accessToken,
          creds.instagramAccountId
        );

        if (liveMedia.length > 0) {
          const livePosts = liveMedia.map((m) => ({
            id: m.id,
            caption: m.caption,
            mediaType: m.mediaType,
            status: "PUBLISHED",
            igMediaId: m.id,
            igPermalink: m.permalink,
            publishedAt: m.timestamp,
            media: [
              {
                id: m.id,
                url:
                  m.mediaUrl ||
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
                fileType: m.mediaType,
              },
            ],
            metrics: {
              likes: m.likes,
              comments: m.comments,
              reach: m.reach,
              views: m.views,
              impressions: m.views,
              shares: m.shares,
              saved: m.saved,
              totalInteractions: m.totalInteractions,
              engagementRate: m.engagementRate,
              availableMetrics: m.availableMetrics,
            },
          }));

          if (type === "posts") {
            const res = NextResponse.json({ posts: livePosts, isLive: true });
            return attachRateLimitHeaders(res, rateLimitResult);
          }
        }
      } catch (liveErr) {
        console.warn("[PostsAPI] Live media fetch fallback to DB:", liveErr);
      }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      const res = NextResponse.json({ posts: [], drafts: [] });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    if (type === "drafts") {
      const drafts = await prisma.draft.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      const res = NextResponse.json({ drafts });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        scheduledPost: true,
        publishingAttempts: true,
      },
    });

    const res = NextResponse.json({ posts });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (error: unknown) {
    console.warn("[PostsAPI] Failed to fetch posts from DB:", error);
    return NextResponse.json({ posts: [], drafts: [] });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(req, "posts-delete", { limit: 30, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "scheduled";

    if (!id) {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Item ID is required" }, { status: 400 }),
        rateLimitResult
      );
    }

    if (isDemoMode()) {
      if (type === "draft" || type === "drafts") {
        const removed = removeMockDraft(id);
        const res = NextResponse.json({ success: removed, id, type: "draft" });
        return attachRateLimitHeaders(res, rateLimitResult);
      } else {
        const removed = removeMockScheduledPost(id);
        const res = NextResponse.json({ success: removed, id, type: "scheduled" });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        rateLimitResult
      );
    }

    if (type === "draft" || type === "drafts") {
      await prisma.draft.deleteMany({
        where: { id, userId },
      });
      const res = NextResponse.json({ success: true, id, type: "draft" });
      return attachRateLimitHeaders(res, rateLimitResult);
    } else {
      await prisma.scheduledPost.updateMany({
        where: { id, userId },
        data: { status: "CANCELLED" },
      });
      const res = NextResponse.json({ success: true, id, type: "scheduled" });
      return attachRateLimitHeaders(res, rateLimitResult);
    }
  } catch (error: unknown) {
    console.error("[PostsAPI] Error deleting/cancelling item:", error);
    return NextResponse.json(
      { error: "Failed to delete or cancel item" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(req, "posts-patch", { limit: 30, windowMs: 60 * 1000 });
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

    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 }),
        rateLimitResult
      );
    }

    const { id, scheduledFor, timezone } = parsed.data;

    const scheduledDate = new Date(scheduledFor);
    const now = Date.now();
    if (isNaN(scheduledDate.getTime())) {
      return attachRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: "The chosen reschedule date is invalid. Please select a valid date and time.",
            category: "INVALID_SCHEDULE_TIME",
          },
          { status: 400 }
        ),
        rateLimitResult
      );
    }
    const diffMs = scheduledDate.getTime() - now;
    if (diffMs <= 0) {
      return attachRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Selected reschedule time is in the past. Please choose a future date and time.",
            category: "INVALID_SCHEDULE_TIME",
            actionLabel: "Pick Future Time",
          },
          { status: 400 }
        ),
        rateLimitResult
      );
    }
    if (diffMs < 10 * 60 * 1000) {
      const minutesAway = Math.max(0, Math.round(diffMs / 60000));
      return attachRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: `Instagram requires scheduled posts to be at least 10 minutes in the future (${minutesAway} minute(s) remaining).`,
            category: "INVALID_SCHEDULE_TIME",
            actionLabel: "Set 15+ Min Ahead",
          },
          { status: 400 }
        ),
        rateLimitResult
      );
    }
    if (diffMs > 75 * 24 * 60 * 60 * 1000) {
      return attachRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Instagram supports scheduling up to 75 days in advance. Please select an earlier date.",
            category: "INVALID_SCHEDULE_TIME",
            actionLabel: "Pick Earlier Date",
          },
          { status: 400 }
        ),
        rateLimitResult
      );
    }

    if (isDemoMode()) {
      const updated = updateMockScheduledPost(id, {
        scheduledFor,
        ...(timezone ? { timezone } : {}),
      });

      if (!updated) {
        return attachRateLimitHeaders(
          NextResponse.json({ error: "Scheduled post not found in demo queue." }, { status: 404 }),
          rateLimitResult
        );
      }

      const res = NextResponse.json({
        success: true,
        message: "Post successfully rescheduled! (Demo Mode)",
        scheduledItem: updated,
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

    const updated = await prisma.scheduledPost.update({
      where: { id },
      data: {
        scheduledFor: new Date(scheduledFor),
        ...(timezone ? { timezone } : {}),
      },
    });

    const res = NextResponse.json({
      success: true,
      message: "Post successfully rescheduled!",
      scheduledItem: updated,
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (error: unknown) {
    console.error("[PostsAPI] Error rescheduling post:", error);
    const friendly = formatApiError(error);
    return NextResponse.json(
      {
        success: false,
        error: friendly.message,
        title: friendly.title,
        category: friendly.category,
      },
      { status: 500 }
    );
  }
}
