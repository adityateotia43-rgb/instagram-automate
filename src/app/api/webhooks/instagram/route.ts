import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getInstagramConfig } from "@/lib/instagram/config";
import { addMockNotification, isDemoMode } from "@/lib/demo";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

/**
 * Validates Meta's HMAC-SHA256 signature from the X-Hub-Signature-256 header.
 */
function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) {
    return false;
  }

  const [algorithm, signature] = signatureHeader.split("=");
  if (algorithm !== "sha256" || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    console.error("[Webhook] Signature calculation error:", err);
    return false;
  }
}

/**
 * GET /api/webhooks/instagram (and /webhooks/instagram)
 * Meta Webhook Verification Handshake
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, "webhook-get", { limit: 120, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const config = getInstagramConfig({ strict: false });
    const expectedToken = config.webhookVerifyToken;

    if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
      const res = new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
      return attachRateLimitHeaders(res, rateLimitResult);
    }

    return attachRateLimitHeaders(
      NextResponse.json(
        { error: "Verification token mismatch or invalid mode" },
        { status: 403 }
      ),
      rateLimitResult
    );
  } catch (err) {
    console.error("[Webhook] Handshake verification error:", err);
    return NextResponse.json(
      { error: "Webhook verification internal error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/instagram (and /webhooks/instagram)
 * Receives Meta Graph API Webhook event payloads.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, "webhook-post", { limit: 120, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256");
    const config = getInstagramConfig({ strict: false });

    // In demo mode or if configured, allow bypassing signature if explicitly requested
    const isSignatureValid =
      isDemoMode() && !signatureHeader
        ? true
        : verifyMetaSignature(rawBody, signatureHeader, config.appSecret);

    if (!isSignatureValid) {
      console.warn("[Webhook] Rejected incoming webhook: Invalid X-Hub-Signature-256");
      return attachRateLimitHeaders(
        NextResponse.json(
          { error: "Forbidden: Signature verification failed" },
          { status: 403 }
        ),
        rateLimitResult
      );
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    // Log event without sensitive authorization data
    const objectType = (payload.object as string) || "instagram";
    console.log(`[Webhook] Event received for object: ${objectType}`);

    try {
      addMockNotification({
        type: "SYSTEM",
        title: "Instagram Webhook Received",
        message: `Received real-time event for ${objectType}`,
        link: "/dashboard/activity",
      });
    } catch {
      // Non-blocking
    }

    const res = NextResponse.json({ success: true }, { status: 200 });
    return attachRateLimitHeaders(res, rateLimitResult);
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return NextResponse.json(
      { error: "Failed to process webhook event" },
      { status: 500 }
    );
  }
}
