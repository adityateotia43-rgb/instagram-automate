/**
 * Webhook Verification & Security Signature Unit Test
 * Run with: npx tsx scripts/test-webhook.ts
 */

import crypto from "crypto";
import { NextRequest } from "next/server";
import { GET, POST } from "../src/app/api/webhooks/instagram/route";

async function runWebhookTests() {
  console.log("==================================================");
  console.log("   Instagram Webhook Handshake & Signature Tests  ");
  console.log("==================================================");

  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "test_verify_token_sample";
  const appSecret = process.env.META_APP_SECRET || "test_meta_app_secret_sample";

  process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = verifyToken;
  process.env.META_APP_SECRET = appSecret;
  process.env.DEMO_MODE = "false";

  // Test 1: GET Handshake with valid token
  console.log("Test 1: GET verification handshake with valid token...");
  const challengeCode = "challenge_code_987654";
  const validGetReq = new NextRequest(
    `http://localhost:3000/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challengeCode}`
  );
  const getRes = await GET(validGetReq);
  const getBody = await getRes.text();

  if (getRes.status === 200 && getBody === challengeCode) {
    console.log("   ✅ Passed: Valid challenge received and returned HTTP 200");
  } else {
    console.error(`   ❌ Failed: Expected 200 with '${challengeCode}', got ${getRes.status}: ${getBody}`);
    process.exit(1);
  }

  // Test 2: GET Handshake with invalid token
  console.log("\nTest 2: GET verification handshake with invalid token...");
  const invalidGetReq = new NextRequest(
    `http://localhost:3000/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=${challengeCode}`
  );
  const invalidGetRes = await GET(invalidGetReq);

  if (invalidGetRes.status === 403) {
    console.log("   ✅ Passed: Rejected with HTTP 403 Forbidden");
  } else {
    console.error(`   ❌ Failed: Expected 403, got ${invalidGetRes.status}`);
    process.exit(1);
  }

  // Test 3: POST event with valid HMAC-SHA256 signature
  console.log("\nTest 3: POST webhook payload with valid X-Hub-Signature-256...");
  const payload = JSON.stringify({
    object: "instagram",
    entry: [{ id: "17841405822340912", time: 1726000000, changes: [{ field: "comments", value: { id: "123" } }] }],
  });

  const validSignature = crypto.createHmac("sha256", appSecret).update(payload, "utf8").digest("hex");

  const validPostReq = new NextRequest("http://localhost:3000/api/webhooks/instagram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": `sha256=${validSignature}`,
    },
    body: payload,
  });

  const postRes = await POST(validPostReq);
  if (postRes.status === 200) {
    console.log("   ✅ Passed: Signature verified, event processed with HTTP 200");
  } else {
    console.error(`   ❌ Failed: Expected 200, got ${postRes.status}`);
    process.exit(1);
  }

  // Test 4: POST event with tampered/invalid signature
  console.log("\nTest 4: POST webhook payload with forged signature...");
  const invalidPostReq = new NextRequest("http://localhost:3000/api/webhooks/instagram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": "sha256=invalid_tampered_signature_hex_00000000000000000000000000000000",
    },
    body: payload,
  });

  const invalidPostRes = await POST(invalidPostReq);
  if (invalidPostRes.status === 403) {
    console.log("   ✅ Passed: Forged signature successfully rejected with HTTP 403");
  } else {
    console.error(`   ❌ Failed: Expected 403, got ${invalidPostRes.status}`);
    process.exit(1);
  }

  console.log("\n--------------------------------------------------");
  console.log("🎉 All Webhook security and handshake tests PASSED!");
  console.log("--------------------------------------------------");
}

runWebhookTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
