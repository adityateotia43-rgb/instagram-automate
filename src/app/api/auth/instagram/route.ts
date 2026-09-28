import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isDemoMode } from "@/lib/demo";
import { rateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rateLimitResult = rateLimit(req, "ig-auth-init", { limit: 15, windowMs: 60 * 1000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const { searchParams } = new URL(req.url);
  const forceDemo = searchParams.get("demo") === "true";

  if (isDemoMode() || forceDemo) {
    const callbackUrl = new URL("/dashboard/settings", req.url);
    callbackUrl.searchParams.set("status", "demo_connected");
    callbackUrl.searchParams.set("username", "luminous.studio");
    return NextResponse.redirect(callbackUrl);
  }

  const appId = process.env.META_APP_ID;
  if (!appId) {
    const errorUrl = new URL("/dashboard/settings", req.url);
    errorUrl.searchParams.set("error", "META_APP_ID is not configured in environment.");
    return NextResponse.redirect(errorUrl);
  }

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${protocol}://${host}/api/auth/instagram/callback`;

  const state = crypto.randomBytes(32).toString("hex");

  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",");

  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl);

  response.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
