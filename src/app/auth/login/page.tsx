"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    urlError === "CredentialsSignin"
      ? "Invalid email or password"
      : urlError
        ? decodeURIComponent(urlError)
        : null
  );
  const [loading, setLoading] = useState(false);

  const handleStudioLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[LoginForm] Form submit event captured. Validating input...");
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      console.log("[LoginForm] Calling NextAuth signIn('credentials') for:", email);
      const authSignInResponse = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      console.log("[LoginForm] NextAuth signIn response:", authSignInResponse);

      if (authSignInResponse?.error) {
        const friendlyMsg =
          authSignInResponse.error === "CredentialsSignin"
            ? "Invalid email or password. Please verify your credentials."
            : authSignInResponse.error;
        setError(friendlyMsg);
        setLoading(false);
      } else {
        console.log("[LoginForm] Authentication successful, navigating to:", callbackUrl);
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("[LoginForm] Unexpected signIn exception:", err);
      setError("An unexpected error occurred during sign in. Please try again.");
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("demo@instaflow.studio");
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-[#1F222B] bg-[#111215] p-8">
      <div className="mb-8 text-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded bg-[#FF4D36] text-white">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
          Sign In to Studio
        </h1>
        <p className="mt-1 text-xs font-mono uppercase tracking-wider text-zinc-400">
          Instagram Content Automation Pipeline
        </p>
      </div>

      {/* Quick Demo Fill Helper */}
      <div className="mb-6 flex items-center justify-between rounded border border-[#262A34] bg-[#161820] px-3.5 py-2 text-xs font-mono text-zinc-300">
        <span className="text-zinc-400">Quick Dev Access:</span>
        <button
          type="button"
          onClick={handleFillDemo}
          className="rounded border border-[#303544] bg-[#222630] px-2.5 py-1 text-xs font-mono text-zinc-200 transition-colors hover:bg-[#2C313E] hover:text-white"
        >
          Use Demo Account
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs font-mono text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleStudioLoginSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-mono uppercase tracking-wider text-zinc-400"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border border-[#262A34] bg-[#161820] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#FF4D36] focus:outline-none focus:ring-1 focus:ring-[#FF4D36]"
            placeholder="director@agency.studio"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-mono uppercase tracking-wider text-zinc-400"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded border border-[#262A34] bg-[#161820] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#FF4D36] focus:outline-none focus:ring-1 focus:ring-[#FF4D36]"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded bg-[#FF4D36] hover:bg-[#E63A23] py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Authenticating...
            </span>
          ) : (
            "Sign In to Studio"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs font-mono text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-[#FF755B] hover:text-[#FF4D36] transition-colors"
        >
          Create studio credentials
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090A0C] px-4 py-12">
      <Suspense
        fallback={
          <div className="text-xs font-mono text-zinc-500">Loading sign in...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
