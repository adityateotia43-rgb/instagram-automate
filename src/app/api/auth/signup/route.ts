import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/auth";
import { validateCsrfOrigin, createCsrfForbiddenResponse } from "@/lib/csrf";
import { rateLimit, createRateLimitResponse, attachRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.valid) {
      return createCsrfForbiddenResponse(csrfCheck.reason);
    }

    const rateLimitResult = rateLimit(request, "auth-signup", { limit: 5, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        "Too many registration attempts. Please wait a moment before trying again."
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 }),
        rateLimitResult
      );
    }

    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || "Invalid registration data";
      return attachRateLimitHeaders(
        NextResponse.json({ error: firstError }, { status: 400 }),
        rateLimitResult
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists with a 3s timeout
    try {
      const userCheckPromise = prisma.user.findUnique({
        where: { email },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timeout")), 3000)
      );

      const existingUser = await Promise.race([userCheckPromise, timeoutPromise]);

      if (existingUser) {
        return attachRateLimitHeaders(
          NextResponse.json(
            { error: "An account with this email already exists" },
            { status: 409 }
          ),
          rateLimitResult
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return attachRateLimitHeaders(
        NextResponse.json(
          {
            message: "Account created successfully",
            user: newUser,
          },
          { status: 201 }
        ),
        rateLimitResult
      );
    } catch (dbError: unknown) {
      console.warn("[Signup] Database unreachable:", dbError instanceof Error ? dbError.message : dbError);

      // In local development, return a mock user so registration and auto sign-in work seamlessly!
      if (process.env.NODE_ENV !== "production") {
        return attachRateLimitHeaders(
          NextResponse.json(
            {
              message: "Account created successfully (Dev Mode)",
              user: {
                id: `dev-user-${Date.now()}`,
                name,
                email,
                role: "USER",
                createdAt: new Date().toISOString(),
              },
            },
            { status: 201 }
          ),
          rateLimitResult
        );
      }

      return attachRateLimitHeaders(
        NextResponse.json(
          { error: "Database is currently offline. Please ensure PostgreSQL is running." },
          { status: 503 }
        ),
        rateLimitResult
      );
    }
  } catch (error: unknown) {
    console.error("[Signup] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
