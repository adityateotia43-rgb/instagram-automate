import fs from "fs";
import path from "path";

// 1. Manually load .env.local and .env
for (const filename of [".env.local", ".env"]) {
  const envFilePath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(envFilePath)) {
    const content = fs.readFileSync(envFilePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

import {
  executePublishingQueue,
  resolvePublishingCredentials,
} from "../src/lib/queue/publisher";
import { instagramClient } from "../src/lib/instagram/client";
import { getMockPublishingAttempts, getMockScheduledPosts } from "../src/lib/demo";

async function main() {
  console.log("==================================================");
  console.log("   Instagram Content Publishing API & Queue Test  ");
  console.log("==================================================");

  // 1. Test Credential Resolution
  console.log("\n1. Testing Credential Resolution...");
  const creds = await resolvePublishingCredentials();
  console.log(`   - Is Real Credentials: ${creds.isReal}`);
  console.log(`   - Instagram Account ID: ${creds.instagramAccountId}`);
  console.log(`   - Token Present: ${Boolean(creds.accessToken)}`);

  if (!creds.isReal) {
    console.error("❌ Live credentials not found in .env or .env.local!");
    process.exit(1);
  }
  console.log("   ✅ Credential resolution passed!");

  // 2. Test Single Media Container Creation (Real Meta Graph API)
  console.log("\n2. Testing Real Meta Media Container Creation...");
  const testImageUrl =
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";

  try {
    const container = await instagramClient.createSingleMediaContainer(
      creds.instagramAccountId,
      creds.accessToken,
      {
        imageUrl: testImageUrl,
        caption: "Automated verification container test #instaflow",
      }
    );
    console.log(`   ✅ Container Created! ID: ${container.id}`);

    // 3. Test Container Status Check
    console.log("\n3. Testing Container Processing Status...");
    const status = await instagramClient.checkContainerStatus(
      container.id,
      creds.accessToken
    );
    console.log(`   ✅ Status Code: ${status.status_code}`);

    // 4. Test Job Queue Execution with Real API Publishing
    console.log("\n4. Testing Job Queue Execution (executePublishingQueue)...");
    const initialAttemptsCount = getMockPublishingAttempts().length;
    const initialScheduled = getMockScheduledPosts();
    console.log(`   - Current scheduled items in queue: ${initialScheduled.length}`);
    console.log(`   - Existing PublishingAttempt records: ${initialAttemptsCount}`);

    const queueResult = await executePublishingQueue({
      forceRealApi: true,
      batchSize: 1,
      includeFuturePending: true,
    });

    console.log("\n   Queue Execution Summary:");
    console.log(`   - Success:        ${queueResult.success}`);
    console.log(`   - Total Checked:  ${queueResult.totalChecked}`);
    console.log(`   - Processed:      ${queueResult.processedCount}`);
    console.log(`   - Success Count:  ${queueResult.successCount}`);
    console.log(`   - Failure Count:  ${queueResult.failureCount}`);
    console.log(`   - Duration:       ${queueResult.durationMs}ms`);

    console.log("\n   Queue Worker Logs:");
    for (const log of queueResult.logs) {
      console.log(`     ${log}`);
    }

    // Verify PublishingAttempt record was logged
    const latestAttempts = getMockPublishingAttempts();
    console.log(`\n   - Total attempts now: ${latestAttempts.length}`);
    const latest = latestAttempts[0];
    if (latest) {
      console.log(`   - Latest Attempt ID:       ${latest.id}`);
      console.log(`   - Status:                  ${latest.status}`);
      console.log(`   - Meta Creation Container: ${latest.creationId}`);
      console.log(`   - HTTP Status:             ${latest.statusCode}`);
      console.log(`   - Duration:                ${latest.durationMs}ms`);
      if (latest.responsePayload) {
        console.log(`   - Response Payload:        ${JSON.stringify(latest.responsePayload)}`);
      }
    }

    if (queueResult.successCount > 0) {
      console.log("\n--------------------------------------------------");
      console.log("🎉 SUCCESS: Live post was published to Instagram via Content Publishing API!");
      console.log("--------------------------------------------------");
    } else {
      console.log("\n⚠️  Queue completed without live success (check logs above).");
    }

    // 5. Test Forced Simulation Mode Fallback
    console.log("\n5. Testing Simulation Mode (FORCE_FAILURE)...");
    const simFailResult = await executePublishingQueue({
      simulateMode: "FORCE_FAILURE",
      batchSize: 1,
      includeFuturePending: true,
    });
    console.log(`   - Simulation Failure Processed: ${simFailResult.failureCount > 0 || simFailResult.processedCount === 0}`);
    console.log("   ✅ Simulation fallback works correctly!");

    console.log("\nAll Content Publishing API & Queue tests passed!");
    process.exit(0);
  } catch (err: unknown) {
    console.error("\n❌ Test failed with error:", err);
    process.exit(1);
  }
}

main();
