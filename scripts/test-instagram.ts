/**
 * Standalone Instagram Graph API Connectivity Test Script
 * Run with: npx tsx scripts/test-instagram.ts
 */

import fs from "fs";
import path from "path";

// 1. Manually load .env.local and .env in Next.js priority order
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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

import { instagramClient, InstagramApiError } from "../src/lib/instagram/client";
import { checkInstagramConfigStatus } from "../src/lib/instagram/config";

async function main() {
  console.log("==================================================");
  console.log("   Instagram Graph API Integration Test");
  console.log("==================================================");

  const status = checkInstagramConfigStatus();
  console.log(`- Demo Mode: ${status.isDemo ? "ENABLED (Mocking calls)" : "DISABLED (Live Meta Graph API)"}`);
  console.log(`- Meta App ID: ${process.env.META_APP_ID || "(missing)"}`);
  console.log(`- Graph API Version: ${process.env.GRAPH_API_VERSION || "v21.0"}`);
  console.log(`- Access Token Present: ${Boolean(process.env.INSTAGRAM_ACCESS_TOKEN)}`);
  
  if (status.missingVariables.length > 0 && !status.isDemo) {
    console.log("\n⚠️  Notice: Missing variables in .env:");
    for (const v of status.missingVariables) {
      console.log(`   - ${v}`);
    }
  }

  console.log("\nCalling getProfile()...\n");

  try {
    const profile = await instagramClient.getProfile();
    console.log("--------------------------------------------------");
    console.log("✅ SUCCESS! Instagram profile fetched successfully:");
    console.log(`   - Username:     @${profile.username}`);
    console.log(`   - Account ID:   ${profile.id}`);
    console.log(`   - Account Type: ${profile.account_type || "N/A"}`);
    console.log(`   - Media Count:  ${profile.media_count ?? 0}`);
    console.log("--------------------------------------------------");

    console.log("\nTesting getMedia(limit = 3)...");
    const media = await instagramClient.getMedia(3);
    console.log(`Fetched ${media.data.length} recent media item(s):`);
    for (const item of media.data) {
      console.log(`   - ID: ${item.id} | Type: ${item.media_type} | Date: ${item.timestamp}`);
    }
    console.log("\nAll Instagram API checks passed!");
    process.exit(0);
  } catch (err: unknown) {
    console.log("--------------------------------------------------");
    if (err instanceof InstagramApiError) {
      console.error("❌ Instagram API Error Encountered:");
      console.error(`   - Status Code:   ${err.code}`);
      if (err.subcode) console.error(`   - Error Subcode: ${err.subcode}`);
      console.error(`   - Error Message: ${err.message}`);
      console.error(`   - Explanation:   ${err.getFriendlyMessage()}`);
      
      if (err.isAuthError) {
        console.error("\n💡 Recommendation: Your INSTAGRAM_ACCESS_TOKEN is either expired, invalid, or missing in .env.");
      } else if (err.isRateLimit) {
        console.error("\n💡 Recommendation: Meta API rate limit has been hit. Please wait a few minutes.");
      }
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Unexpected Error:", msg);
    }
    console.log("--------------------------------------------------");
    process.exit(1);
  }
}

main();
