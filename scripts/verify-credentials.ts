/**
 * Verification script for META_APP_ID and META_APP_SECRET
 * Verifies presence, format, and load status without exposing secret values.
 */

import fs from "fs";
import path from "path";

// Load .env.local and .env in priority order
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

import { getInstagramConfig } from "../src/lib/instagram/config";

function verify() {
  console.log("==================================================");
  console.log("   Meta Credentials Verification (Redacted)      ");
  console.log("==================================================");

  const rawAppId = process.env.META_APP_ID;
  const rawAppSecret = process.env.META_APP_SECRET;

  const config = getInstagramConfig({ strict: false });

    const isAppIdSet = Boolean(rawAppId && rawAppId.trim().length > 0);
  const isAppIdNumeric = isAppIdSet && /^\d+$/.test(rawAppId!.trim());
  const appIdLength = isAppIdSet ? rawAppId!.trim().length : 0;
  const isAppIdInConfig = Boolean(config.appId && config.appId === rawAppId);

  console.log("\nMETA_APP_ID:");
  console.log(`  - Present in environment:    ${isAppIdSet ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Character length:          ${appIdLength} digits`);
  console.log(`  - Format valid (numeric):    ${isAppIdNumeric ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Loaded in instagramConfig: ${isAppIdInConfig ? "✅ YES" : "❌ NO"}`);

    const isSecretSet = Boolean(rawAppSecret && rawAppSecret.trim().length > 0);
  const isSecretHex = isSecretSet && /^[a-f0-9]{32}$/i.test(rawAppSecret!.trim());
  const secretLength = isSecretSet ? rawAppSecret!.trim().length : 0;
  const isSecretInConfig = Boolean(config.appSecret && config.appSecret === rawAppSecret);

  console.log("\nMETA_APP_SECRET:");
  console.log(`  - Present in environment:    ${isSecretSet ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Character length:          ${secretLength} characters`);
  console.log(`  - Format valid (32-char hex):${isSecretHex ? "✅ YES" : "❌ NO"}`);
  console.log(`  - Loaded in instagramConfig: ${isSecretInConfig ? "✅ YES" : "❌ NO"}`);

  console.log("\n--------------------------------------------------");
  if (isAppIdSet && isAppIdNumeric && isSecretSet && isSecretHex && isAppIdInConfig && isSecretInConfig) {
    console.log("🎉 ALL CHECKS PASSED: META_APP_ID and META_APP_SECRET are correctly loaded!");
  } else {
    console.log("⚠️ One or more credential checks failed.");
  }
  console.log("--------------------------------------------------");
}

verify();
