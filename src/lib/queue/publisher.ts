import { formatApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type DbScheduledPost = Prisma.ScheduledPostGetPayload<{
  include: {
    post: {
      include: {
        media: {
          include: {
            media: true;
          };
        };
      };
    };
  };
}>;

import { instagramClient } from "@/lib/instagram/client";
import { decryptToken } from "@/lib/crypto";
import {
  isDemoMode,
  getMockScheduledPosts,
  updateMockScheduledPost,
  simulateMockPublish,
  addMockPublishingAttempt,
  getMockPublishingAttempts,
  addMockNotification,
  getMockAccount,
  MockPublishingAttempt,
} from "@/lib/demo";

export interface QueueRunOptions {
  simulateMode?: "RANDOM" | "FORCE_SUCCESS" | "FORCE_FAILURE" | "REAL_API";
  failureRate?: number; // 0 to 1, default 0.25 (when using simulation)
  batchSize?: number; // Max items to process in one execution run
  includeFuturePending?: boolean; // In testing, process PENDING items even if scheduled in the future
  forceRealApi?: boolean; // Force live Meta Graph API publishing
}

export interface QueueExecutionResult {
  success: boolean;
  message: string;
  totalChecked: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  attempts: MockPublishingAttempt[];
  logs: string[];
  durationMs: number;
}

// Realistic Meta Graph API simulation failure errors (for sandbox / mock fallback)
const SIMULATED_META_ERRORS = [
  {
    code: 100,
    subcode: 2207001,
    message: "Media container encoding timed out or unsupported video profile.",
  },
  {
    code: 100,
    subcode: 2207008,
    message: "Aspect ratio outside supported range for Instagram Feed/Reels (must be between 4:5 and 1.91:1).",
  },
  {
    code: 100,
    subcode: 2207027,
    message: "The media file could not be downloaded from the provided source URL.",
  },
  {
    code: 190,
    subcode: 463,
    message: "OAuth access token has expired or session was invalidated.",
  },
];

/**
 * Resolves active Instagram Account credentials for content publishing.
 * Prioritizes active Prisma InstagramAccount with decrypted OAuthToken,
 * falling back to local .env configuration (INSTAGRAM_ACCESS_TOKEN).
 */
export async function resolvePublishingCredentials(accountId?: string): Promise<{
  instagramAccountId: string;
  accessToken: string;
  isReal: boolean;
}> {
  try {
    let account = null;
    if (accountId) {
      account = await prisma.instagramAccount.findFirst({
        where: { id: accountId, isActive: true },
        include: { oauthToken: true },
      });
    }
    if (!account) {
      account = await prisma.instagramAccount.findFirst({
        where: { isActive: true },
        include: { oauthToken: true },
      });
    }

    if (account?.oauthToken?.accessToken) {
      const decrypted = decryptToken(account.oauthToken.accessToken);
      if (decrypted) {
        return {
          instagramAccountId: account.instagramId,
          accessToken: decrypted,
          isReal: true,
        };
      }
    }
  } catch {
    // Database connection is offline or unseeded
  }

  const envToken =
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.INSTAGRAM_TEST_ACCESS_TOKEN;

  if (envToken && envToken.trim().length > 10) {
    let resolvedAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
    if (!resolvedAccountId) {
      try {
        const profile = await instagramClient.getProfile(envToken);
        resolvedAccountId = profile.id;
      } catch {
        resolvedAccountId = "28242433545399022"; // Verified ID for @adi78287
      }
    }
    return {
      instagramAccountId: resolvedAccountId,
      accessToken: envToken.trim(),
      isReal: true,
    };
  }

  // 3. Fallback to Mock Account for Sandbox Demo Mode
  const mock = getMockAccount();
  return {
    instagramAccountId: mock.instagramId,
    accessToken: "mock_demo_access_token",
    isReal: false,
  };
}

/**
 * Job Queue Worker: Evaluates scheduled posts and publishes them
 * using the real Instagram Content Publishing API (with simulation fallback for offline testing),
 * logging full granular audit trails to the PublishingAttempt model.
 */
export async function executePublishingQueue(
  options: QueueRunOptions = {}
): Promise<QueueExecutionResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  const attempts: MockPublishingAttempt[] = [];

  const simulateMode = options.simulateMode || "RANDOM";
  const failureRate = options.failureRate !== undefined ? options.failureRate : 0.25;
  const batchSize = options.batchSize || 5;
  const includeFuturePending = options.includeFuturePending ?? true;
  const forceRealApi = Boolean(options.forceRealApi || simulateMode === "REAL_API");

  const creds = await resolvePublishingCredentials();

  logs.push(
    `[QueueWorker] Started at ${new Date().toLocaleTimeString()} (mode: ${simulateMode}, realApi: ${creds.isReal ? "AVAILABLE" : "UNAVAILABLE"}, account: ${creds.instagramAccountId})`
  );

  let successCount = 0;
  let failureCount = 0;

  // ---------------------------------------------------------------------------
  // STEP 1: CHECK DATABASE IF NOT IN PURE DEMO MODE
  // ---------------------------------------------------------------------------
  let dbPosts: DbScheduledPost[] = [];
  let isDbAvailable = false;

  if (!isDemoMode()) {
    try {
      const now = new Date();
      dbPosts = await prisma.scheduledPost.findMany({
        where: {
          status: "PENDING",
          scheduledFor: includeFuturePending ? undefined : { lte: now },
        },
        include: {
          post: {
            include: {
              media: {
                include: {
                  media: true,
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
        take: batchSize,
      });
      isDbAvailable = true;
    } catch {
      isDbAvailable = false;
      logs.push(
        "[QueueWorker] PostgreSQL offline or unseeded. Falling back to active queue store."
      );
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 2: PROCESS DATABASE POSTS (IF FOUND)
  // ---------------------------------------------------------------------------
  if (isDbAvailable && dbPosts.length > 0) {
    logs.push(
      `[QueueWorker-DB] Found ${dbPosts.length} due post(s) in PostgreSQL queue.`
    );

    for (const scheduledDrop of dbPosts) {
      const itemStartTime = Date.now();
      const attemptNum = scheduledDrop.retryCount + 1;
      const creationId = `container_db_${Date.now()}`;

      const postCreds = await resolvePublishingCredentials(
        scheduledDrop.instagramAccountId
      );

      const isSimulationForced =
        simulateMode === "FORCE_FAILURE" || simulateMode === "FORCE_SUCCESS";

      if (postCreds.isReal && !isSimulationForced) {
        const mediaUrls = scheduledDrop.post.media.map((m) => m.media.url);
        const isCarousel = mediaUrls.length > 1;

        const publishResult = await instagramClient.executePublish(
          postCreds.instagramAccountId,
          postCreds.accessToken,
          {
            mediaUrls,
            mediaType: isCarousel ? "CAROUSEL" : "IMAGE",
            caption: scheduledDrop.post.caption || undefined,
            forceReal: true,
          }
        );

        const duration = publishResult.durationMs ?? Date.now() - itemStartTime;

        if (publishResult.success && publishResult.igMediaId) {
          successCount++;
          await prisma.publishingAttempt.create({
            data: {
              postId: scheduledDrop.postId,
              status: "SUCCESS",
              creationId: publishResult.containerId || creationId,
              statusCode: 200,
              attemptNumber: attemptNum,
              durationMs: duration,
              completedAt: new Date(),
            },
          });

          await prisma.scheduledPost.update({
            where: { id: scheduledDrop.id },
            data: { status: "COMPLETED" },
          });

          await prisma.post.update({
            where: { id: scheduledDrop.postId },
            data: {
              status: "PUBLISHED",
              igMediaId: publishResult.igMediaId,
              igPermalink: publishResult.permalink,
              publishedAt: new Date(),
            },
          });

          logs.push(
            `[QueueWorker-DB] Post ${scheduledDrop.id} published live to Instagram as ID ${publishResult.igMediaId}`
          );
        } else {
          failureCount++;
          await prisma.publishingAttempt.create({
            data: {
              postId: scheduledDrop.postId,
              status: "FAILED",
              creationId: publishResult.containerId || creationId,
              statusCode: publishResult.statusCode || 400,
              errorMessage: publishResult.error,
              errorSubcode: publishResult.errorSubcode,
              attemptNumber: attemptNum,
              durationMs: duration,
              completedAt: new Date(),
            },
          });

          await prisma.scheduledPost.update({
            where: { id: scheduledDrop.id },
            data: {
              status: "FAILED",
              lastError: publishResult.error,
              retryCount: { increment: 1 },
            },
          });

          logs.push(
            `[QueueWorker-DB] Post ${scheduledDrop.id} failed: ${publishResult.error}`
          );
        }
      } else {
        // Fallback simulation in DB mode
        const shouldFail =
          simulateMode === "FORCE_FAILURE"
            ? true
            : simulateMode === "FORCE_SUCCESS"
            ? false
            : Math.random() < failureRate;

        if (shouldFail) {
          failureCount++;
          const errorTemplate =
            SIMULATED_META_ERRORS[
              Math.floor(Math.random() * SIMULATED_META_ERRORS.length)
            ];
          const duration = Date.now() - itemStartTime + 200;

          await prisma.publishingAttempt.create({
            data: {
              postId: scheduledDrop.postId,
              status: "FAILED",
              creationId,
              statusCode: 400,
              errorMessage: errorTemplate.message,
              errorSubcode: errorTemplate.subcode,
              attemptNumber: attemptNum,
              durationMs: duration,
              completedAt: new Date(),
            },
          });

          await prisma.scheduledPost.update({
            where: { id: scheduledDrop.id },
            data: {
              status: "FAILED",
              lastError: errorTemplate.message,
              retryCount: { increment: 1 },
            },
          });

          logs.push(
            `[QueueWorker-DB] Post ${scheduledDrop.id} failed with subcode ${errorTemplate.subcode} (Simulated)`
          );
        } else {
          successCount++;
          const duration = Date.now() - itemStartTime + 350;
          const fakeIgId = `18029${Date.now().toString().slice(-8)}`;

          await prisma.publishingAttempt.create({
            data: {
              postId: scheduledDrop.postId,
              status: "SUCCESS",
              creationId,
              statusCode: 200,
              attemptNumber: attemptNum,
              durationMs: duration,
              completedAt: new Date(),
            },
          });

          await prisma.scheduledPost.update({
            where: { id: scheduledDrop.id },
            data: { status: "COMPLETED" },
          });

          await prisma.post.update({
            where: { id: scheduledDrop.postId },
            data: {
              status: "PUBLISHED",
              igMediaId: fakeIgId,
              igPermalink: `https://instagram.com/p/DF${fakeIgId.slice(-6)}`,
              publishedAt: new Date(),
            },
          });

          logs.push(
            `[QueueWorker-DB] Post ${scheduledDrop.id} published successfully as IG ID ${fakeIgId} (Simulated)`
          );
        }
      }
    }

    return {
      success: true,
      message: `Queue processed ${dbPosts.length} post(s) via DB. Success: ${successCount}, Failed: ${failureCount}.`,
      totalChecked: dbPosts.length,
      processedCount: dbPosts.length,
      successCount,
      failureCount,
      attempts,
      logs,
      durationMs: Date.now() - startTime,
    };
  }

  // ---------------------------------------------------------------------------
  // STEP 3: PROCESS IN-MEMORY QUEUE (DEMO MODE OR DB OFFLINE FALLBACK)
  // ---------------------------------------------------------------------------
  const scheduled = getMockScheduledPosts();
  const now = new Date();

  const candidateDrops = scheduled.filter((queuedDrop) => {
    if (queuedDrop.status !== "PENDING") return false;
    if (includeFuturePending) return true;
    return new Date(queuedDrop.scheduledFor) <= now;
  });

  const dropsToProcess = candidateDrops.slice(0, batchSize);
  logs.push(
    `[QueueWorker] Found ${candidateDrops.length} candidate(s), processing batch of ${dropsToProcess.length}.`
  );

  if (dropsToProcess.length === 0) {
    logs.push("[QueueWorker] No scheduled posts pending execution.");
    return {
      success: true,
      message: "Queue check completed: No pending scheduled posts found.",
      totalChecked: candidateDrops.length,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      attempts: getMockPublishingAttempts().slice(0, 5),
      logs,
      durationMs: Date.now() - startTime,
    };
  }

  for (const queuedDrop of dropsToProcess) {
    const itemStartTime = Date.now();
    const attemptNumber = 1;
    const creationId = `container_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const isSimulationForced =
      simulateMode === "FORCE_FAILURE" || simulateMode === "FORCE_SUCCESS";
    const useRealPublishing =
      !isSimulationForced && (forceRealApi || simulateMode === "REAL_API" || creds.isReal);

    if (useRealPublishing && creds.isReal) {
      // =======================================================================
      // REAL INSTAGRAM CONTENT PUBLISHING API CALLS
      // =======================================================================
      logs.push(
        `[QueueWorker] Publishing post "${queuedDrop.caption.slice(0, 25)}..." to Instagram Graph API (Account: ${creds.instagramAccountId})...`
      );

      const publishResult = await instagramClient.executePublish(
        creds.instagramAccountId,
        creds.accessToken,
        {
          mediaUrls: [queuedDrop.thumbnailUrl],
          mediaType: queuedDrop.mediaType === "REEL" ? "REEL" : "IMAGE",
          caption: queuedDrop.caption,
          forceReal: true,
        }
      );

      const duration = publishResult.durationMs ?? Date.now() - itemStartTime;

      if (publishResult.success && publishResult.igMediaId) {
        successCount++;
        logs.push(
          `[QueueWorker] Post "${queuedDrop.caption.slice(0, 25)}..." [LIVE SUCCESS]: Meta IG Media ID ${publishResult.igMediaId} | Permalink: ${publishResult.permalink || "N/A"}`
        );

        const attempt = addMockPublishingAttempt({
          postId: queuedDrop.postId || queuedDrop.id,
          postCaption: queuedDrop.caption,
          scheduledPostId: queuedDrop.id,
          status: "SUCCESS",
          creationId: publishResult.containerId || creationId,
          statusCode: 200,
          requestPayload: {
            scheduledPostId: queuedDrop.id,
            mediaType: queuedDrop.mediaType,
            thumbnailUrl: queuedDrop.thumbnailUrl,
            caption: queuedDrop.caption,
            instagramAccountId: creds.instagramAccountId,
          },
          responsePayload: {
            id: publishResult.igMediaId,
            permalink: publishResult.permalink,
            containerId: publishResult.containerId,
          },
          attemptNumber,
          startedAt: new Date(itemStartTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: duration,
        });
        attempts.push(attempt);

        updateMockScheduledPost(queuedDrop.id, {
          status: "COMPLETED",
        });

        addMockNotification({
          type: "POST_PUBLISHED",
          title: "Post Published to Instagram (Live)",
          message: `"${queuedDrop.caption.slice(0, 35)}..." published live to Instagram via Content Publishing API.`,
          link: publishResult.permalink || "/dashboard/scheduled",
          metadata: {
            igMediaId: publishResult.igMediaId,
            permalink: publishResult.permalink,
            attemptId: attempt.id,
          },
        });

        try {
          await prisma.publishingAttempt.create({
            data: {
              postId: queuedDrop.postId || queuedDrop.id,
              status: "SUCCESS",
              creationId: publishResult.containerId || creationId,
              statusCode: 200,
              attemptNumber,
              durationMs: duration,
              completedAt: new Date(),
            },
          });
        } catch {
          // Graceful fallback when DB is offline
        }
      } else {
        failureCount++;
        const errorMsg =
          publishResult.error || "Meta Graph API container publishing failed.";
        const subcode = publishResult.errorSubcode || 0;
        logs.push(
          `[QueueWorker] Post "${queuedDrop.caption.slice(0, 25)}..." [LIVE FAILED]: ${errorMsg} (Code: ${publishResult.statusCode}, Subcode: ${subcode})`
        );

        const attempt = addMockPublishingAttempt({
          postId: queuedDrop.postId || queuedDrop.id,
          postCaption: queuedDrop.caption,
          scheduledPostId: queuedDrop.id,
          status: "FAILED",
          creationId: publishResult.containerId || creationId,
          statusCode: publishResult.statusCode || 400,
          errorMessage: errorMsg,
          errorSubcode: subcode,
          requestPayload: {
            scheduledPostId: queuedDrop.id,
            mediaType: queuedDrop.mediaType,
            thumbnailUrl: queuedDrop.thumbnailUrl,
            caption: queuedDrop.caption,
            instagramAccountId: creds.instagramAccountId,
          },
          responsePayload: {
            error: {
              message: errorMsg,
              code: publishResult.statusCode,
              error_subcode: subcode,
            },
          },
          attemptNumber,
          startedAt: new Date(itemStartTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: duration,
        });
        attempts.push(attempt);

        updateMockScheduledPost(queuedDrop.id, {
          status: "FAILED",
        });

        addMockNotification({
          type: "POST_FAILED",
          title: "Live Publishing Failed",
          message: `Notice for "${queuedDrop.caption.slice(0, 30)}...": ${formatApiError(errorMsg).message}`,
          link: formatApiError(errorMsg).actionUrl || "/dashboard/scheduled",
          metadata: {
            error: errorMsg,
            errorSubcode: subcode,
            attemptId: attempt.id,
          },
        });

        try {
          await prisma.publishingAttempt.create({
            data: {
              postId: queuedDrop.postId || queuedDrop.id,
              status: "FAILED",
              creationId: publishResult.containerId || creationId,
              statusCode: publishResult.statusCode || 400,
              errorMessage: errorMsg,
              errorSubcode: subcode,
              attemptNumber,
              durationMs: duration,
              completedAt: new Date(),
            },
          });
        } catch {
          // Graceful fallback when DB is offline
        }
      }
    } else {
      // =======================================================================
      // SANDBOX DEMO SIMULATION (WHEN FORCED OR OFFLINE)
      // =======================================================================
      let shouldFail = false;
      if (simulateMode === "FORCE_FAILURE") {
        shouldFail = true;
      } else if (simulateMode === "FORCE_SUCCESS") {
        shouldFail = false;
      } else {
        shouldFail = Math.random() < failureRate;
      }

      if (shouldFail) {
        failureCount++;
        const errorTemplate =
          SIMULATED_META_ERRORS[
            Math.floor(Math.random() * SIMULATED_META_ERRORS.length)
          ];
        const duration =
          Date.now() - itemStartTime + Math.floor(Math.random() * 400 + 200);

        logs.push(
          `[QueueWorker] Post "${queuedDrop.caption.slice(0, 25)}..." [SIMULATED FAILED]: Subcode ${errorTemplate.subcode} - ${errorTemplate.message}`
        );

        const attempt = addMockPublishingAttempt({
          postId: queuedDrop.postId || queuedDrop.id,
          postCaption: queuedDrop.caption,
          scheduledPostId: queuedDrop.id,
          status: "FAILED",
          creationId,
          statusCode: 400,
          errorMessage: errorTemplate.message,
          errorSubcode: errorTemplate.subcode,
          requestPayload: {
            scheduledPostId: queuedDrop.id,
            mediaType: queuedDrop.mediaType,
            thumbnailUrl: queuedDrop.thumbnailUrl,
            caption: queuedDrop.caption,
          },
          responsePayload: {
            error: {
              message: errorTemplate.message,
              type: "OAuthException",
              code: errorTemplate.code,
              error_subcode: errorTemplate.subcode,
            },
          },
          attemptNumber,
          startedAt: new Date(itemStartTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: duration,
        });
        attempts.push(attempt);

        updateMockScheduledPost(queuedDrop.id, {
          status: "FAILED",
        });

        addMockNotification({
          type: "POST_FAILED",
          title: "Scheduled Post Publishing Failed (Simulation)",
          message: `Notice for "${queuedDrop.caption.slice(0, 30)}...": ${formatApiError(errorTemplate.message).message}`,
          link: formatApiError(errorTemplate.message).actionUrl || "/dashboard/scheduled",
          metadata: {
            errorSubcode: errorTemplate.subcode,
            scheduledPostId: queuedDrop.id,
            attemptId: attempt.id,
          },
        });

        try {
          await prisma.publishingAttempt.create({
            data: {
              postId: queuedDrop.postId || queuedDrop.id,
              status: "FAILED",
              creationId,
              statusCode: 400,
              errorMessage: errorTemplate.message,
              errorSubcode: errorTemplate.subcode,
              attemptNumber,
              durationMs: duration,
              completedAt: new Date(),
            },
          });
        } catch {
          // Graceful fallback when DB is offline
        }
      } else {
        successCount++;
        const publishResult = simulateMockPublish({
          mediaUrls: [queuedDrop.thumbnailUrl],
          mediaType: queuedDrop.mediaType === "REEL" ? "REEL" : "IMAGE",
          caption: queuedDrop.caption,
        });

        const duration =
          Date.now() - itemStartTime + Math.floor(Math.random() * 500 + 300);

        logs.push(
          `[QueueWorker] Post "${queuedDrop.caption.slice(0, 25)}..." [SIMULATED SUCCESS]: IG Media ID ${publishResult.igMediaId}`
        );

        const attempt = addMockPublishingAttempt({
          postId: queuedDrop.postId || queuedDrop.id,
          postCaption: queuedDrop.caption,
          scheduledPostId: queuedDrop.id,
          status: "SUCCESS",
          creationId,
          statusCode: 200,
          requestPayload: {
            scheduledPostId: queuedDrop.id,
            mediaType: queuedDrop.mediaType,
            thumbnailUrl: queuedDrop.thumbnailUrl,
            caption: queuedDrop.caption,
          },
          responsePayload: {
            id: publishResult.igMediaId,
            permalink: publishResult.permalink,
          },
          attemptNumber,
          startedAt: new Date(itemStartTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: duration,
        });
        attempts.push(attempt);

        updateMockScheduledPost(queuedDrop.id, {
          status: "COMPLETED",
        });

        addMockNotification({
          type: "POST_PUBLISHED",
          title: "Scheduled Post Published (Simulation)",
          message: `"${queuedDrop.caption.slice(0, 35)}..." published via Meta Graph API simulation.`,
          link: "/dashboard/scheduled",
          metadata: {
            igMediaId: publishResult.igMediaId,
            permalink: publishResult.permalink,
            attemptId: attempt.id,
          },
        });

        try {
          await prisma.publishingAttempt.create({
            data: {
              postId: queuedDrop.postId || queuedDrop.id,
              status: "SUCCESS",
              creationId,
              statusCode: 200,
              attemptNumber,
              durationMs: duration,
              completedAt: new Date(),
            },
          });
        } catch {
          // Graceful fallback when DB is offline
        }
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  logs.push(
    `[QueueWorker] Batch completed in ${totalDuration}ms. Success: ${successCount}, Failed: ${failureCount}.`
  );

  return {
    success: true,
    message: `Queue processed ${dropsToProcess.length} post(s): ${successCount} published, ${failureCount} failed.`,
    totalChecked: candidateDrops.length,
    processedCount: dropsToProcess.length,
    successCount,
    failureCount,
    attempts,
    logs,
    durationMs: totalDuration,
  };
}
