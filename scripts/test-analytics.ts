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

import { instagramClient } from "../src/lib/instagram/client";
import { resolvePublishingCredentials } from "../src/lib/queue/publisher";

async function main() {
  console.log("==================================================");
  console.log("   Instagram Analytics & Insights API Test        ");
  console.log("==================================================");

  console.log("\n1. Resolving Active Credentials...");
  const creds = await resolvePublishingCredentials();
  console.log(`   - Is Real Credentials:  ${creds.isReal}`);
  console.log(`   - Instagram Account ID:  ${creds.instagramAccountId}`);
  console.log(`   - Access Token Present:  ${Boolean(creds.accessToken)}`);

  if (!creds.isReal) {
    console.error("❌ Live credentials not found in environment!");
    process.exit(1);
  }
  console.log("   ✅ Credentials resolved successfully!");

  console.log("\n2. Testing getAccountInsights()...");
  const accountInsights = await instagramClient.getAccountInsights(
    creds.accessToken,
    creds.instagramAccountId
  );
  console.log(`   ✅ Account Insights Fetched:`);
  console.log(`      - Reach:             ${accountInsights.reach}`);
  console.log(`      - Accounts Engaged:  ${accountInsights.accountsEngaged}`);
  console.log(`      - Total Interactions: ${accountInsights.totalInteractions}`);
  console.log(`      - Content Views:     ${accountInsights.views}`);
  console.log(`      - Followers Count:   ${accountInsights.followersCount}`);
  console.log(`      - Media Count:       ${accountInsights.mediaCount}`);
  console.log(`      - Daily Reach Points: ${accountInsights.dailyReach.length}`);

  console.log("\n3. Testing getRecentMediaWithInsights()...");
  const mediaItems = await instagramClient.getRecentMediaWithInsights(
    5,
    creds.accessToken,
    creds.instagramAccountId
  );
  console.log(`   ✅ Fetched ${mediaItems.length} media item(s) with live insights:`);
  for (const m of mediaItems) {
    console.log(`      - [${m.mediaType}] ID: ${m.id}`);
    console.log(`        Caption: "${(m.caption || "").slice(0, 30)}..."`);
    console.log(`        Likes: ${m.likes} | Comments: ${m.comments} | Reach: ${m.reach} | Views: ${m.views}`);
    console.log(`        Saves: ${m.saved} | Shares: ${m.shares} | Engagement Rate: ${m.engagementRate}%`);
    console.log(`        Available Metrics: [${m.availableMetrics.join(", ")}]`);
    if (m.permalink) {
      console.log(`        Permalink: ${m.permalink}`);
    }
  }

  console.log("\n4. Testing getAggregatedAnalytics()...");
  const aggregated = await instagramClient.getAggregatedAnalytics(
    creds.accessToken,
    creds.instagramAccountId
  );
  console.log(`   ✅ Aggregated Analytics Complete:`);
  console.log(`      - Source:               ${aggregated.source}`);
  console.log(`      - Account Username:     @${aggregated.account.username}`);
  console.log(`      - Total Reach:          ${aggregated.overview.reach}`);
  console.log(`      - Total Views:          ${aggregated.overview.views}`);
  console.log(`      - Total Interactions:   ${aggregated.overview.totalInteractions}`);
  console.log(`      - Avg Engagement Rate:  ${aggregated.overview.avgEngagementRate}%`);

  console.log("\n5. Permissions & Metric Availability Breakdown:");
  for (const item of aggregated.metricsAvailability) {
    const symbol = item.isAvailable ? "✅" : "⚠️ ";
    console.log(`      ${symbol} ${item.label}: ${item.statusText}`);
    if (item.reason) {
      console.log(`         Policy/Reason: ${item.reason}`);
    }
  }

  console.log("\n--------------------------------------------------");
  console.log("🎉 SUCCESS: Real Instagram Analytics & Insights API Verified!");
  console.log("--------------------------------------------------");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Analytics test failed with exception:", err);
  process.exit(1);
});
