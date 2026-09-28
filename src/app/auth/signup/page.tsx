"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStudioRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SignupPage] Form submit event captured. Validating input...");
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      console.log("[SignupPage] Sending registration POST request to /api/auth/signup for:", email);
      const registrationApiResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const registrationPayload = await registrationApiResponse.json();
      console.log("[SignupPage] Registration API response:", { status: registrationApiResponse.status, data: registrationPayload });

      if (!registrationApiResponse.ok) {
        setError(registrationPayload.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      console.log("[SignupPage] Auto signing in with new credentials...");
      const autoSignInResponse = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      console.log("[SignupPage] Auto sign-in result:", autoSignInResponse);

      if (autoSignInResponse?.error) {
        router.push("/auth/login?registered=true");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("[SignupPage] Unexpected error during signup:", err);
      setError("An error occurred during registration. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090A0C] px-4 py-12">
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
            Create Studio Account
          </h1>
          <p className="mt-1 text-xs font-mono uppercase tracking-wider text-zinc-400">
            Instagram Content Automation Pipeline
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleStudioRegistrationSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-400"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded border border-[#262A34] bg-[#161820] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#FF4D36] focus:outline-none focus:ring-1 focus:ring-[#FF4D36]"
              placeholder="Adrian Vance"
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-[#262A34] bg-[#161820] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#FF4D36] focus:outline-none focus:ring-1 focus:ring-[#FF4D36]"
              placeholder="Min. 8 characters (alphanumeric)"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-400"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-[#262A34] bg-[#161820] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#FF4D36] focus:outline-none focus:ring-1 focus:ring-[#FF4D36]"
              placeholder="Confirm security password"
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
                Creating account...
              </span>
            ) : (
              "Create Studio Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-mono text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[#FF755B] hover:text-[#FF4D36] transition-colors"
          >
            Sign in to studio
          </Link>
        </div>
      </div>
    </main>
  );
}
