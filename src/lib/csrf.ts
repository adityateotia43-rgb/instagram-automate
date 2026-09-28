import { NextRequest, NextResponse } from "next/server";

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateCsrfOrigin(req: NextRequest | Request): CsrfValidationResult {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/webhooks")) {
    return { valid: true };
  }

  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { valid: true };
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host") || req.headers.get("x-forwarded-host");

  if (!origin && !referer) {
    if (process.env.NODE_ENV !== "production") {
      return { valid: true };
    }
    return { valid: false, reason: "Missing Origin or Referer header on state-modifying request" };
  }

  const allowedHosts = new Set<string>();
  if (host) allowedHosts.add(host.toLowerCase());
  if (process.env.NEXTAUTH_URL) {
    try {
      const parsedUrl = new URL(process.env.NEXTAUTH_URL);
      allowedHosts.add(parsedUrl.host.toLowerCase());
    } catch {}
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const parsedUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
      allowedHosts.add(parsedUrl.host.toLowerCase());
    } catch {}
  }

  if (process.env.NODE_ENV !== "production") {
    allowedHosts.add("localhost:3000");
    allowedHosts.add("127.0.0.1:3000");
    allowedHosts.add("localhost:3001");
    allowedHosts.add("127.0.0.1:3001");
  }

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (!allowedHosts.has(originUrl.host.toLowerCase())) {
        return {
          valid: false,
          reason: `Origin '${originUrl.host}' does not match allowed server hosts.`,
        };
      }
    } catch {
      return { valid: false, reason: "Invalid Origin header format." };
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!allowedHosts.has(refererUrl.host.toLowerCase())) {
        return {
          valid: false,
          reason: `Referer '${refererUrl.host}' does not match allowed server hosts.`,
        };
      }
    } catch {
      return { valid: false, reason: "Invalid Referer header format." };
    }
  }

  return { valid: true };
}

export function createCsrfForbiddenResponse(reason?: string): NextResponse {
  return NextResponse.json(
    {
      error: "CSRF verification failed",
      message: reason || "Cross-site request rejected.",
    },
    { status: 403 }
  );
}
