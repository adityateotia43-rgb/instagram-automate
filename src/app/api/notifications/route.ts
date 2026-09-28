import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isDemoMode,
  getMockNotifications,
  markMockNotificationAsRead,
  markAllMockNotificationsAsRead,
  deleteMockNotification,
  clearMockReadNotifications,
  addMockNotification,
} from "@/lib/demo";
import { z } from "zod";
import { validateCsrfOrigin, createCsrfForbiddenResponse } from "@/lib/csrf";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

const patchNotificationSchema = z
  .object({
    id: z.string().optional(),
    all: z.boolean().optional(),
  })
  .refine((data) => data.id !== undefined || data.all !== undefined, {
    message: "Either 'id' or 'all' must be specified",
  });

const createNotificationSchema = z.object({
  type: z.enum(["POST_PUBLISHED", "POST_FAILED", "TOKEN_EXPIRING", "TOKEN_EXPIRED", "SCHEDULED_REMINDER", "ACCOUNT_DISCONNECTED", "SYSTEM"]).default("SYSTEM"),
  title: z.string().min(1, "Title is required").max(150, "Title is too long"),
  message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
  link: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, "notifications-get", { limit: 60, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    if (isDemoMode()) {
      const items = getMockNotifications();
      const unreadCount = items.filter((n) => !n.isRead).length;
      const res = NextResponse.json({
        success: true,
        notifications: items,
        unreadCount,
        total: items.length,
        isDemo: true,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      const items = getMockNotifications();
      const res = NextResponse.json({
        success: true,
        notifications: items,
        unreadCount: items.filter((n) => !n.isRead).length,
        total: items.length,
        isDemo: true,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      const res = NextResponse.json({
        success: true,
        notifications,
        unreadCount,
        total: notifications.length,
        isDemo: false,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    } catch (dbError) {
      console.warn("[NotificationsAPI] DB offline, using mock notifications:", dbError);
      const items = getMockNotifications();
      const res = NextResponse.json({
        success: true,
        notifications: items,
        unreadCount: items.filter((n) => !n.isRead).length,
        total: items.length,
        isDemo: true,
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }
  } catch (error) {
    console.error("[NotificationsAPI] Error in GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
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

    const rateLimitResult = rateLimit(req, "notifications-patch", { limit: 50, windowMs: 60 * 1000 });
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

    const parsed = patchNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return attachRateLimitHeaders(
        NextResponse.json({ success: false, error: "Invalid request payload", details: parsed.error.flatten() }, { status: 400 }),
        rateLimitResult
      );
    }

    const { id, all } = parsed.data;

    if (isDemoMode()) {
      if (all) {
        const count = markAllMockNotificationsAsRead();
        const res = NextResponse.json({
          success: true,
          message: `Marked ${count} notifications as read`,
          isDemo: true,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      }

      if (id) {
        const item = markMockNotificationAsRead(id);
        if (!item) {
          return attachRateLimitHeaders(
            NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 }),
            rateLimitResult
          );
        }
        const res = NextResponse.json({
          success: true,
          notification: item,
          isDemo: true,
        });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      if (all) markAllMockNotificationsAsRead();
      else if (id) markMockNotificationAsRead(id);
      const res = NextResponse.json({ success: true, isDemo: true });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    try {
      if (all) {
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        const res = NextResponse.json({ success: true, isDemo: false });
        return attachRateLimitHeaders(res, rateLimitResult);
      }

      if (id) {
        const updated = await prisma.notification.update({
          where: { id },
          data: { isRead: true, readAt: new Date() },
        });
        const res = NextResponse.json({ success: true, notification: updated, isDemo: false });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
    } catch (dbError) {
      console.warn("[NotificationsAPI] DB offline in PATCH, using mock:", dbError);
      if (all) markAllMockNotificationsAsRead();
      else if (id) markMockNotificationAsRead(id);
      const res = NextResponse.json({ success: true, isDemo: true });
      return attachRateLimitHeaders(res, rateLimitResult);
    }
  } catch (error) {
    console.error("[NotificationsAPI] Error in PATCH:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(req, "notifications-delete", { limit: 50, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearRead = searchParams.get("clearRead") === "true";

    if (!id && !clearRead) {
      return attachRateLimitHeaders(
        NextResponse.json({ success: false, error: "Missing id or clearRead param" }, { status: 400 }),
        rateLimitResult
      );
    }

    if (isDemoMode()) {
      if (clearRead) {
        const removed = clearMockReadNotifications();
        const res = NextResponse.json({ success: true, removed, isDemo: true });
        return attachRateLimitHeaders(res, rateLimitResult);
      }

      if (id) {
        const removed = deleteMockNotification(id);
        const res = NextResponse.json({ success: removed, isDemo: true });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      if (clearRead) clearMockReadNotifications();
      else if (id) deleteMockNotification(id);
      const res = NextResponse.json({ success: true, isDemo: true });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    try {
      if (clearRead) {
        await prisma.notification.deleteMany({
          where: { userId, isRead: true },
        });
        const res = NextResponse.json({ success: true, isDemo: false });
        return attachRateLimitHeaders(res, rateLimitResult);
      }

      if (id) {
        await prisma.notification.delete({
          where: { id },
        });
        const res = NextResponse.json({ success: true, isDemo: false });
        return attachRateLimitHeaders(res, rateLimitResult);
      }
    } catch (dbError) {
      console.warn("[NotificationsAPI] DB offline in DELETE, using mock:", dbError);
      if (clearRead) clearMockReadNotifications();
      else if (id) deleteMockNotification(id);
      const res = NextResponse.json({ success: true, isDemo: true });
      return attachRateLimitHeaders(res, rateLimitResult);
    }
  } catch (error) {
    console.error("[NotificationsAPI] Error in DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
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

    const rateLimitResult = rateLimit(req, "notifications-post", { limit: 30, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return attachRateLimitHeaders(
        NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 }),
        rateLimitResult
      );
    }

    const parsed = createNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return attachRateLimitHeaders(
        NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 400 }),
        rateLimitResult
      );
    }

    const { type, title, message, link, metadata } = parsed.data;

    const newNotif = addMockNotification({
      type,
      title,
      message,
      link,
      metadata,
    });

    const res = NextResponse.json({
      success: true,
      notification: newNotif,
      isDemo: true,
    });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (error) {
    console.error("[NotificationsAPI] Error in POST:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
