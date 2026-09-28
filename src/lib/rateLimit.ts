import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60 * 1000);

      if (this.cleanupInterval && typeof this.cleanupInterval.unref === "function") {
        this.cleanupInterval.unref();
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    this.store.forEach((record, key) => {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    });
  }

  public check(identifier: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const existing = this.store.get(identifier);

    if (!existing || now > existing.resetTime) {
      const resetTime = now + options.windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return {
        success: true,
        limit: options.limit,
        remaining: options.limit - 1,
        reset: Math.ceil(resetTime / 1000),
      };
    }

    if (existing.count < options.limit) {
      existing.count += 1;
      return {
        success: true,
        limit: options.limit,
        remaining: options.limit - existing.count,
        reset: Math.ceil(existing.resetTime / 1000),
      };
    }

    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: Math.ceil(existing.resetTime / 1000),
    };
  }

  public reset(identifier: string): void {
    this.store.delete(identifier);
  }
}

const globalRateLimiter = new InMemoryRateLimiter();

export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "127.0.0.1";
}

export function rateLimit(
  req: NextRequest | Request,
  routeKey: string,
  options: RateLimitOptions
): RateLimitResult {
  const ip = getClientIp(req);
  const identifier = `${routeKey}:${ip}`;
  return globalRateLimiter.check(identifier, options);
}

export function createRateLimitResponse(result: RateLimitResult, customMessage?: string): NextResponse {
  const retryAfterSeconds = Math.max(1, result.reset - Math.ceil(Date.now() / 1000));
  const message =
    customMessage || `Too many requests. Please slow down and try again in ${retryAfterSeconds} seconds.`;

  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      message,
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": retryAfterSeconds.toString(),
      },
    }
  );
}

export function attachRateLimitHeaders(res: NextResponse, result: RateLimitResult): NextResponse {
  res.headers.set("X-RateLimit-Limit", result.limit.toString());
  res.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  res.headers.set("X-RateLimit-Reset", result.reset.toString());
  return res;
}
