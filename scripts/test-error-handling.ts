/**
 * Comprehensive Automated Verification Suite for User-Friendly Error Handling
 * Tests all 8 error categories:
 * 1. Invalid Media
 * 2. Unsupported Formats
 * 3. API Rate Limits
 * 4. Expired Tokens
 * 5. Permission Errors
 * 6. Network Failures
 * 7. Duplicate Publishing Prevention
 * 8. Invalid Scheduling Times
 */

import {
  formatApiError,
  validateScheduleTime,
  generatePostSignature,
  checkAndRecordDuplicatePublish,
} from "../src/lib/errors";
import { InstagramApiError } from "../src/lib/instagram/client";

console.log("==================================================");
console.log("   User-Friendly Error Handling Verification Suite ");
console.log("==================================================");

let passed = 0;
let failed = 0;

function assert(condition: boolean | undefined, testName: string, detail?: string) {
  const ok = Boolean(condition);
  if (ok) {
    console.log(`   ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`   ❌ FAIL: ${testName}`);
    if (detail) console.error(`      Detail: ${detail}`);
    failed++;
  }
}

// 1. EXPIRED TOKENS
console.log("\n[Test 1] Expired & Invalid Token Mapping (Code 190, Subcode 463/467)");
const errToken190 = formatApiError(new InstagramApiError("Error validating access token: Session has expired", 190, 463));
assert(
  errToken190.category === "EXPIRED_TOKEN",
  "Category is EXPIRED_TOKEN for Code 190 / Subcode 463",
  `Got: ${errToken190.category}`
);
assert(
  errToken190.actionLabel === "Reconnect Instagram Account",
  "Action label instructs user to reconnect account",
  `Got: ${errToken190.actionLabel}`
);
assert(
  errToken190.actionUrl === "/dashboard/settings",
  "Action URL points to Settings",
  `Got: ${errToken190.actionUrl}`
);
assert(
  errToken190.retryable === false,
  "Expired token is marked not retryable until reconnection",
  `Got retryable: ${errToken190.retryable}`
);

// 2. PERMISSION ERRORS
console.log("\n[Test 2] Missing Permissions & Capability Errors (Code 10, 200-299)");
const errPerm = formatApiError({
  code: 10,
  subcode: 464,
  message: "(#10) Application does not have permission for instagram_content_publish",
});
assert(
  errPerm.category === "PERMISSION_ERROR",
  "Category is PERMISSION_ERROR for Code 10 / Subcode 464",
  `Got: ${errPerm.category}`
);
assert(
  errPerm.message.includes("missing required Instagram permissions"),
  "Message clearly explains missing permissions without raw OAuth stack",
  `Got message: ${errPerm.message}`
);

// 3. API RATE LIMITS
console.log("\n[Test 3] Meta Graph API Rate Limits (Codes 4, 17, 32, 613, HTTP 429)");
const errRate4 = formatApiError(new InstagramApiError("Application request limit reached", 4));
assert(
  errRate4.category === "RATE_LIMITED",
  "Category is RATE_LIMITED for Code 4",
  `Got: ${errRate4.category}`
);
assert(
  errRate4.message.includes("wait 15–30 minutes"),
  "Message suggests waiting 15–30 minutes cooldown",
  `Got: ${errRate4.message}`
);

const errRate613 = formatApiError({
  code: 613,
  message: "Calls to this api have exceeded the rate of 200 calls per hour",
});
assert(
  errRate613.category === "RATE_LIMITED",
  "Category is RATE_LIMITED for Code 613",
  `Got: ${errRate613.category}`
);

// 4. INVALID MEDIA & ASPECT RATIO
console.log("\n[Test 4] Invalid Media & Aspect Ratio Constraints (Code 36003, 2207001)");
const errAspect = formatApiError(new InstagramApiError("The aspect ratio is not allowed", 36003));
assert(
  errAspect.category === "INVALID_MEDIA",
  "Category is INVALID_MEDIA for Code 36003",
  `Got: ${errAspect.category}`
);
assert(
  errAspect.message.includes("between 4:5 (portrait) and 1.91:1"),
  "Message informs user about 4:5 and 1.91:1 bounds",
  `Got: ${errAspect.message}`
);

const errVideo = formatApiError({
  code: 2207004,
  message: "Video duration exceeds maximum allowable length",
});
assert(
  errVideo.category === "INVALID_MEDIA",
  "Category is INVALID_MEDIA for video duration",
  `Got: ${errVideo.category}`
);
assert(
  errVideo.message.includes("between 3 seconds and 15 minutes"),
  "Message specifies 3s to 15m duration range",
  `Got: ${errVideo.message}`
);

// 5. UNSUPPORTED FORMATS
console.log("\n[Test 5] Unsupported Media Formats");
const errFormat = formatApiError("Unsupported file format: image/bmp. Allowed formats are JPEG, PNG, WEBP, and MP4/MOV.");
assert(
  errFormat.category === "UNSUPPORTED_FORMAT",
  "Category is UNSUPPORTED_FORMAT",
  `Got: ${errFormat.category}`
);
assert(
  errFormat.message.includes("JPG, PNG, or WEBP images, or MP4 / MOV videos"),
  "Message lists supported Instagram media formats",
  `Got: ${errFormat.message}`
);

// 6. NETWORK FAILURES & TIMEOUTS
console.log("\n[Test 6] Network Failures & Connectivity Loss");
const errNetwork = formatApiError(new TypeError("fetch failed: ECONNREFUSED 127.0.0.1"));
assert(
  errNetwork.category === "NETWORK_FAILURE",
  "Category is NETWORK_FAILURE for fetch failed / ECONNREFUSED",
  `Got: ${errNetwork.category}`
);
assert(
  errNetwork.message.includes("Unable to connect to the Instagram servers"),
  "Message politely informs user of connection trouble",
  `Got: ${errNetwork.message}`
);

// 7. DUPLICATE PUBLISHING PREVENTION
console.log("\n[Test 7] Duplicate Publishing Prevention");
const sig1 = generatePostSignature(
  ["https://cdn.example.com/photo1.jpg"],
  "Exclusive launch drop preview #horizon",
  "acc_123"
);
const sig2 = generatePostSignature(
  ["https://cdn.example.com/photo1.jpg"],
  "Exclusive launch drop preview #horizon",
  "acc_123"
);
assert(sig1 === sig2, "Identical content generates identical signatures");

const userA = `user_test_${Date.now()}`;
const checkFirst = checkAndRecordDuplicatePublish(userA, sig1);
assert(!checkFirst.isDuplicate, "First publish attempt succeeds without duplicate warning");

const checkImmediateDup = checkAndRecordDuplicatePublish(userA, sig1);
assert(
  checkImmediateDup.isDuplicate,
  "Immediate repeated attempt is caught as duplicate",
  `isDuplicate: ${checkImmediateDup.isDuplicate}`
);

const sigDifferent = generatePostSignature(
  ["https://cdn.example.com/photo2.jpg"],
  "Different photo",
  "acc_123"
);
const checkDifferent = checkAndRecordDuplicatePublish(userA, sigDifferent);
assert(!checkDifferent.isDuplicate, "Different content is not flagged as duplicate");

// 8. INVALID SCHEDULING TIMES
console.log("\n[Test 8] Schedule Date & Time Bounds Validation");
// 8a. Missing parameters
const schedMissing = validateScheduleTime("", "");
assert(!schedMissing.valid, "Rejects missing date and time");

// 8b. In the past
const pastDate = "2020-01-01";
const schedPast = validateScheduleTime(pastDate, "12:00");
assert(!schedPast.valid, "Rejects date in the past");
assert(
  schedPast.error?.message.includes("already passed"),
  "Explains time has passed",
  `Got: ${schedPast.error?.message}`
);

// 8c. Too close (< 10 minutes)
const nowPlus2Min = new Date(Date.now() + 2 * 60 * 1000);
const yyyy = nowPlus2Min.getFullYear();
const mm = String(nowPlus2Min.getMonth() + 1).padStart(2, "0");
const dd = String(nowPlus2Min.getDate()).padStart(2, "0");
const hh = String(nowPlus2Min.getHours()).padStart(2, "0");
const min = String(nowPlus2Min.getMinutes()).padStart(2, "0");
const schedTooClose = validateScheduleTime(`${yyyy}-${mm}-${dd}`, `${hh}:${min}`);
assert(!schedTooClose.valid, "Rejects time within 10 minutes of now");
assert(
  schedTooClose.error?.message.includes("at least 10 minutes in the future"),
  "Informs user about the 10-minute minimum lead time requirement",
  `Got: ${schedTooClose.error?.message}`
);

// 8d. Too far in the future (> 75 days)
const day80 = new Date(Date.now() + 80 * 24 * 60 * 60 * 1000);
const yyyy80 = day80.getFullYear();
const mm80 = String(day80.getMonth() + 1).padStart(2, "0");
const dd80 = String(day80.getDate()).padStart(2, "0");
const schedTooFar = validateScheduleTime(`${yyyy80}-${mm80}-${dd80}`, "14:00");
assert(!schedTooFar.valid, "Rejects date beyond 75 days in advance");
assert(
  schedTooFar.error?.message.includes("supports scheduling up to 75 days in advance"),
  "Informs user about the 75-day maximum scheduling limit",
  `Got: ${schedTooFar.error?.message}`
);

// 8e. Valid schedule time (tomorrow 18:00)
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const yyyyT = tomorrow.getFullYear();
const mmT = String(tomorrow.getMonth() + 1).padStart(2, "0");
const ddT = String(tomorrow.getDate()).padStart(2, "0");
const schedValid = validateScheduleTime(`${yyyyT}-${mmT}-${ddT}`, "18:00");
assert(schedValid.valid, "Accepts valid future schedule time (tomorrow 18:00)");

console.log("\n--------------------------------------------------");
if (failed === 0) {
  console.log(`🎉 ALL ${passed} ERROR HANDLING TESTS PASSED!`);
} else {
  console.error(`💥 ${failed} TEST(S) FAILED out of ${passed + failed}.`);
  process.exit(1);
}
console.log("--------------------------------------------------");
