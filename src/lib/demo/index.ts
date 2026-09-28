import {
  mockAccount,
  mockPosts,
  mockScheduledPosts,
  mockDrafts,
  mockAnalytics,
  mockNotifications,
  mockUserSettings,
  mockPublishingAttempts,
  MockAccount,
  MockPost,
  MockScheduledItem,
  MockDraft,
  MockAnalytics,
  MockNotification,
  MockUserSettings,
  MockPublishingAttempt,
} from "./mockData";
import { PublishingResult } from "../instagram/types";

/**
 * In-memory mutable collections for active demo session
 */
const dynamicPosts: MockPost[] = [...mockPosts];
const dynamicScheduled: MockScheduledItem[] = [...mockScheduledPosts];
const dynamicDrafts: MockDraft[] = [...mockDrafts];
const dynamicNotifications: MockNotification[] = [...mockNotifications];
const dynamicSettings: MockUserSettings = { ...mockUserSettings };
const dynamicPublishingAttempts: MockPublishingAttempt[] = [...mockPublishingAttempts];

/**
 * Returns true if DEMO_MODE is active via environment variable.
 */
let runtimeDemoOverride: boolean | null = null;

export function setRuntimeDemoMode(enabled: boolean): void {
  runtimeDemoOverride = enabled;
}

export function isDemoMode(): boolean {
  if (runtimeDemoOverride !== null) return runtimeDemoOverride;
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

export function getMockAccount(): MockAccount {
  return mockAccount;
}

export function getMockPosts(): MockPost[] {
  return dynamicPosts;
}

export function getMockScheduledPosts(): MockScheduledItem[] {
  return dynamicScheduled;
}

export function getMockDrafts(): MockDraft[] {
  return dynamicDrafts;
}

export function getMockAnalytics(): MockAnalytics {
  return mockAnalytics;
}

export function addMockScheduledPost(postInput: {
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL" | "STORY";
  thumbnailUrl: string;
  scheduledFor: string;
  timezone?: string;
  aspectRatio?: string;
}): MockScheduledItem {
  const newItem: MockScheduledItem = {
    id: `sched_${Date.now()}`,
    postId: `post_sched_${Date.now()}`,
    caption: postInput.caption,
    mediaType: postInput.mediaType,
    thumbnailUrl: postInput.thumbnailUrl,
    scheduledFor: postInput.scheduledFor,
    timezone: postInput.timezone || "PST (UTC-8)",
    status: "PENDING",
    aspectRatio: postInput.aspectRatio || "1:1",
  };

  dynamicScheduled.unshift(newItem);
  return newItem;
}

export function addMockDraft(draftInput: {
  title?: string;
  caption: string;
  hashtags?: string[];
  mediaType?: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL";
  thumbnailUrl?: string;
}): MockDraft {
  const newDraft: MockDraft = {
    id: `draft_${Date.now()}`,
    title: draftInput.title || draftInput.caption.slice(0, 30) || "Untitled Draft",
    caption: draftInput.caption,
    hashtags: draftInput.hashtags || [],
    mediaType: draftInput.mediaType || "IMAGE",
    thumbnailUrl:
      draftInput.thumbnailUrl ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    updatedAt: new Date().toISOString(),
  };

  dynamicDrafts.unshift(newDraft);
  return newDraft;
}

export function simulateMockPublish(options: {
  mediaUrls: string[];
  mediaType: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL";
  caption?: string;
}): PublishingResult {
  const id = Date.now().toString();
  const permalink = `https://instagram.com/p/DF${id.slice(-6)}`;
  const igMediaId = `18029${id.slice(-8)}`;

    dynamicPosts.unshift({
    id: `post_${id}`,
    caption: options.caption || "Demo Post Published Live",
    mediaType: options.mediaType,
    aspectRatio: "1:1",
    media: options.mediaUrls.map((url, idx) => ({
      id: `media_${id}_${idx}`,
      url,
      fileType: options.mediaType === "REEL" ? "REEL" : "IMAGE",
      width: 2160,
      height: 2160,
      order: idx,
    })),
    status: "PUBLISHED",
    igMediaId,
    igPermalink: permalink,
    publishedAt: new Date().toISOString(),
    metrics: {
      likes: 1,
      comments: 0,
      reach: 12,
      impressions: 15,
      saved: 0,
      shares: 0,
      engagementRate: 8.3,
    },
  });

  return {
    success: true,
    containerId: `container_${id}`,
    igMediaId,
    permalink,
    durationMs: 420,
  };
}

export function removeMockScheduledPost(id: string): boolean {
  const index = dynamicScheduled.findIndex((s) => s.id === id);
  if (index !== -1) {
    dynamicScheduled.splice(index, 1);
    return true;
  }
  return false;
}

export function updateMockScheduledPost(
  id: string,
  updates: Partial<MockScheduledItem>
): MockScheduledItem | null {
  const index = dynamicScheduled.findIndex((s) => s.id === id);
  if (index !== -1) {
    dynamicScheduled[index] = { ...dynamicScheduled[index], ...updates };
    return dynamicScheduled[index];
  }
  return null;
}

export function removeMockDraft(id: string): boolean {
  const index = dynamicDrafts.findIndex((d) => d.id === id);
  if (index !== -1) {
    dynamicDrafts.splice(index, 1);
    return true;
  }
  return false;
}

export function getMockNotifications(): MockNotification[] {
  return dynamicNotifications;
}

export function markMockNotificationAsRead(id: string): MockNotification | null {
  const notificationRecord = dynamicNotifications.find((n) => n.id === id);
  if (notificationRecord) {
    notificationRecord.isRead = true;
    notificationRecord.readAt = new Date().toISOString();
    return notificationRecord;
  }
  return null;
}

export function markAllMockNotificationsAsRead(): number {
  let count = 0;
  const now = new Date().toISOString();
  dynamicNotifications.forEach((n) => {
    if (!n.isRead) {
      n.isRead = true;
      n.readAt = now;
      count++;
    }
  });
  return count;
}

export function deleteMockNotification(id: string): boolean {
  const index = dynamicNotifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    dynamicNotifications.splice(index, 1);
    return true;
  }
  return false;
}

export function clearMockReadNotifications(): number {
  let removed = 0;
  for (let i = dynamicNotifications.length - 1; i >= 0; i--) {
    if (dynamicNotifications[i].isRead) {
      dynamicNotifications.splice(i, 1);
      removed++;
    }
  }
  return removed;
}

export function addMockNotification(notificationInput: {
  type: MockNotification["type"];
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}): MockNotification {
  const newNotification: MockNotification = {
    id: `notif_${Date.now()}`,
    type: notificationInput.type,
    title: notificationInput.title,
    message: notificationInput.message,
    isRead: false,
    createdAt: new Date().toISOString(),
    link: notificationInput.link,
    metadata: notificationInput.metadata,
  };
  dynamicNotifications.unshift(newNotification);
  return newNotification;
}

export function getMockSettings(): MockUserSettings {
  return dynamicSettings;
}

export function updateMockSettings(partial: Partial<MockUserSettings>): MockUserSettings {
  Object.assign(dynamicSettings, partial);
  return dynamicSettings;
}

export function refreshMockToken(): { success: boolean; tokenDaysLeft: number } {
  dynamicSettings.tokenDaysLeft = 60;
  return { success: true, tokenDaysLeft: 60 };
}

export function getMockPublishingAttempts(): MockPublishingAttempt[] {
  return dynamicPublishingAttempts;
}

export function addMockPublishingAttempt(
  attempt: Omit<MockPublishingAttempt, "id">
): MockPublishingAttempt {
  const newAttempt: MockPublishingAttempt = {
    id: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...attempt,
  };
  dynamicPublishingAttempts.unshift(newAttempt);
  return newAttempt;
}

export type { MockPublishingAttempt };





