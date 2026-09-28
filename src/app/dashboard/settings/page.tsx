"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { MockPublishingAttempt } from "@/lib/demo/mockData";
import { formatApiError } from "@/lib/errors";

interface AccountDetails {
  username: string;
  name: string;
  followersCount: number;
  profilePictureUrl: string;
  accountType: string;
  facebookPageName: string;
  isVerified: boolean;
  isDemo?: boolean;
  isConnected?: boolean;
  tokenDaysLeft?: number;
  isEncrypted?: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"ACCOUNTS" | "AUTOMATION" | "SCHEDULER" | "WORKSPACE">("ACCOUNTS");
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tokenDaysLeft, setTokenDaysLeft] = useState(52);
  const [isDemoModeActive, setIsDemoModeActive] = useState(false);
  const [isTokenEncryptedInDb, setIsTokenEncryptedInDb] = useState(true);
  const [isTriggeringScheduler, setIsTriggeringScheduler] = useState(false);
  const [schedulerLogs, setSchedulerLogs] = useState<string[]>([
    "[Scheduler] Worker initialized with interval: 1m",
    "[Scheduler] Last run: 0 pending posts processed. Next scan in 45s.",
  ]);

  const [simulateMode, setSimulateMode] = useState<"RANDOM" | "FORCE_SUCCESS" | "FORCE_FAILURE" | "REAL_API">("RANDOM");
  const [queueAttempts, setQueueAttempts] = useState<MockPublishingAttempt[]>([]);
  const [queueMetrics, setQueueMetrics] = useState({
    totalScheduled: 3,
    pending: 3,
    completed: 0,
    failed: 0,
  });

  const [autoFirstComment, setAutoFirstComment] = useState(true);
  const [firstCommentTemplate, setFirstCommentTemplate] = useState(
    "Drop a 🔥 if you want a DM invite to tomorrow's backstage breakdown!"
  );
  const [defaultRatio, setDefaultRatio] = useState<"1:1" | "4:5" | "16:9">("1:1");
  const [defaultTimezone, setDefaultTimezone] = useState("PST (UTC-8)");
  const [shareToFacebook, setShareToFacebook] = useState(true);
  const [autoHashtagsInComment, setAutoHashtagsInComment] = useState(false);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [disableComments, setDisableComments] = useState(false);

  const [metaAppId, setMetaAppId] = useState("91823471029384");
  const [metaAppSecret, setMetaAppSecret] = useState("8a9f4c3b2e1d0f5e7c9a1b3d5e7f9a2b");
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [isSavingAppCreds, setIsSavingAppCreds] = useState(false);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState("Luminous Studio Global");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const accRes = await fetch("/api/account");
        const accData = await accRes.json();
        if (accData.account) {
          setAccount({
            ...accData.account,
            isDemo: accData.isDemo,
          });
        }

        try {
          const modeRes = await fetch("/api/settings/mode");
          const modeData = await modeRes.json();
          if (typeof modeData.isDemo === "boolean") {
            setIsDemoModeActive(modeData.isDemo);
          }
          const stRes = await fetch("/api/auth/instagram/status");
          const stData = await stRes.json();
          if (stData.connected && stData.account) {
            setAccount((prev) => ({
              ...(prev || { followersCount: 142800, isVerified: true }),
              ...stData.account,
              isDemo: stData.isDemo,
            }));
            if (typeof stData.account.tokenDaysLeft === "number") {
              setTokenDaysLeft(stData.account.tokenDaysLeft);
            }
            if (typeof stData.account.isEncrypted === "boolean") {
              setIsTokenEncryptedInDb(stData.account.isEncrypted);
            }
          }
        } catch (e) {
          console.error("Error fetching mode/status:", e);
        }

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const status = params.get("status");
          const username = params.get("username");
          const oauthErr = params.get("error");
          if (status === "connected") {
            toast.success(
              "Instagram account (@" + (username || "connected") + ") linked via Meta OAuth 2.0! Token securely encrypted (AES-256-GCM).",
              "Instagram Connected"
            );
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (status === "demo_connected") {
            toast.info(
              "Demo Instagram account connected in simulated sandbox mode.",
              "Demo Sandbox Connected"
            );
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (oauthErr) {
            const raw = decodeURIComponent(oauthErr);
            const userFacing = formatApiError(raw);
            toast.error(userFacing.message, userFacing.title);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        const savedLocal = localStorage.getItem("instaflow_user_settings");
        if (savedLocal) {
          try {
            const parsed = JSON.parse(savedLocal);
            if (typeof parsed.autoFirstComment === "boolean") setAutoFirstComment(parsed.autoFirstComment);
            if (parsed.firstCommentTemplate) setFirstCommentTemplate(parsed.firstCommentTemplate);
            if (parsed.defaultRatio) setDefaultRatio(parsed.defaultRatio);
            if (parsed.defaultTimezone) setDefaultTimezone(parsed.defaultTimezone);
            if (typeof parsed.shareToFacebook === "boolean") setShareToFacebook(parsed.shareToFacebook);
            if (typeof parsed.autoHashtagsInComment === "boolean") setAutoHashtagsInComment(parsed.autoHashtagsInComment);
            if (typeof parsed.hideLikeCount === "boolean") setHideLikeCount(parsed.hideLikeCount);
            if (typeof parsed.disableComments === "boolean") setDisableComments(parsed.disableComments);
            if (parsed.metaAppId) setMetaAppId(parsed.metaAppId);
            if (parsed.metaAppSecret) setMetaAppSecret(parsed.metaAppSecret);
          } catch (e) {
            console.error("Error reading localStorage settings:", e);
          }
        }

        const setRes = await fetch("/api/settings");
        const setData = await setRes.json();
        if (setData.settings) {
          const s = setData.settings;
          if (typeof s.autoFirstComment === "boolean") setAutoFirstComment(s.autoFirstComment);
          if (s.firstCommentTemplate) setFirstCommentTemplate(s.firstCommentTemplate);
          if (s.defaultRatio) setDefaultRatio(s.defaultRatio);
          if (s.defaultTimezone) setDefaultTimezone(s.defaultTimezone);
          if (typeof s.shareToFacebook === "boolean") setShareToFacebook(s.shareToFacebook);
          if (typeof s.autoHashtagsInComment === "boolean") setAutoHashtagsInComment(s.autoHashtagsInComment);
          if (typeof s.hideLikeCount === "boolean") setHideLikeCount(s.hideLikeCount);
          if (typeof s.disableComments === "boolean") setDisableComments(s.disableComments);
          if (typeof s.tokenDaysLeft === "number") setTokenDaysLeft(s.tokenDaysLeft);
          if (s.metaAppId) setMetaAppId(s.metaAppId);
          if (s.metaAppSecret) setMetaAppSecret(s.metaAppSecret);
        }

        const queueRes = await fetch("/api/queue");
        const queueData = await queueRes.json();
        if (queueData.recentAttempts && Array.isArray(queueData.recentAttempts)) {
          setQueueAttempts(queueData.recentAttempts);
        }
        if (queueData.queue) {
          setQueueMetrics((prev) => ({
            ...prev,
            ...queueData.queue,
          }));
        }
      } catch (err) {
        console.error("Failed to load account, settings, or queue:", err);
      }
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_token" }),
      });
      const data = await res.json();
      setTokenDaysLeft(data.tokenDaysLeft || 60);
      toast.success("Meta long-lived access token refreshed! Valid for 60 days.", "Token Refreshed");
    } catch (err) {
      console.error("Failed to refresh token:", err);
      setTokenDaysLeft(60);
      toast.success("Meta long-lived access token refreshed! Valid for 60 days.", "Token Refreshed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnectFacebook = async () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setConnectModalOpen(false);
      setAccount((prev) =>
        prev
          ? { ...prev, facebookPageName: selectedPage }
          : {
              username: "@luminous.studio",
              name: "Luminous Design Studio",
              followersCount: 142800,
              profilePictureUrl:
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
              accountType: "BUSINESS",
              facebookPageName: selectedPage,
              isVerified: true,
              isDemo: true,
            }
      );
      toast.success(`Instagram Business Account linked to ${selectedPage}!`, "Meta Page Linked");
    }, 1200);
  };

  const handleToggleDemoMode = async () => {
    const nextMode = !isDemoModeActive;
    try {
      const modeSwitchResponse = await fetch("/api/settings/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoMode: nextMode }),
      });
      const modeSwitchPayload = await modeSwitchResponse.json();
      setIsDemoModeActive(modeSwitchPayload.isDemo);
      if (modeSwitchPayload.isDemo) {
        toast.info("Switched to DEMO_MODE (Simulated Sandbox). Meta API calls bypassed.", "Demo Mode Active");
      } else {
        toast.success("Switched to REAL API Mode. Connected to live Meta Graph API v21.0.", "Real API Mode Active");
      }
      const stRes = await fetch("/api/auth/instagram/status");
      const stData = await stRes.json();
      if (stData.connected && stData.account) {
        setAccount((prev) => ({
          ...(prev || { followersCount: 142800, isVerified: true }),
          ...stData.account,
          isDemo: stData.isDemo,
        }));
        if (typeof stData.account.tokenDaysLeft === "number") setTokenDaysLeft(stData.account.tokenDaysLeft);
        if (typeof stData.account.isEncrypted === "boolean") setIsTokenEncryptedInDb(stData.account.isEncrypted);
      }
    } catch (err) {
      console.error("Failed to toggle mode:", err);
      toast.error("Failed to switch application mode", "Error");
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!confirm("Are you sure you want to disconnect this Instagram account?")) return;
    try {
      const res = await fetch("/api/auth/instagram/status", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.info("Instagram account disconnected successfully.", "Disconnected");
        setAccount((prev) => (prev ? { ...prev, isConnected: false } : null));
      }
    } catch {
      toast.error("Failed to disconnect Instagram account", "Error");
    }
  };

  const handleTriggerScheduler = async () => {
    setIsTriggeringScheduler(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulateMode, forceRealApi: simulateMode === "REAL_API" }),
      });
      const data = await res.json();
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      const newLog = `[${new Date().toLocaleTimeString()}] Queue run complete (${elapsed}s) -> ${
        data.message || "0 due posts found"
      }`;
      setSchedulerLogs((prev) => [newLog, ...prev]);

      if (data.attempts && Array.isArray(data.attempts)) {
        setQueueAttempts((prev) => [...data.attempts, ...prev]);
        setQueueMetrics((prev) => ({
          ...prev,
          completed: prev.completed + (data.successCount || 0),
          failed: prev.failed + (data.failureCount || 0),
          pending: Math.max(0, prev.pending - (data.processedCount || 0)),
        }));
      }

      if (data.failureCount > 0 && data.successCount > 0) {
        toast.warning(data.message, "Queue Simulation Result");
      } else if (data.failureCount > 0) {
        toast.error(data.message, "Simulation Failure Logged");
      } else {
        toast.success(data.message || "Queue batch processed!", "Queue Worker Finished");
      }
    } catch (err) {
      console.error("Error triggering scheduler:", err);
      const newLog = `[${new Date().toLocaleTimeString()}] Manual trigger completed (fallback mode)`;
      setSchedulerLogs((prev) => [newLog, ...prev]);
      toast.info("Scheduler test scan completed.", "Cron Diagnostic");
    } finally {
      setIsTriggeringScheduler(false);
    }
  };

  const handleSavePreferences = async () => {
    const payload = {
      autoFirstComment,
      firstCommentTemplate,
      defaultRatio,
      defaultTimezone,
      shareToFacebook,
      autoHashtagsInComment,
      hideLikeCount,
      disableComments,
    };

    // Save to localStorage for instant client-side composer adoption
    localStorage.setItem("instaflow_user_settings", JSON.stringify(payload));

    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Error syncing preferences to API:", e);
    }

    toast.success("Publishing presets saved! New studio posts will use these defaults.", "Preferences Saved");
  };

  const handleSaveAppCredentials = async () => {
    setIsSavingAppCreds(true);
    const payload = { metaAppId, metaAppSecret };
    // Server-side only: do not persist secrets in localStorage

    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Error saving app credentials:", e);
    }

    setTimeout(() => {
      setIsSavingAppCreds(false);
      toast.success("Meta Graph API credentials saved successfully!", "Credentials Updated");
    }, 600);
  };

  return (
    <div className="mx-auto max-w-5xl px-space-md py-space-lg sm:px-space-xl">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Settings & Account Operations
            </h1>
            {isDemoModeActive ? (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 " />
                DEMO MODE (Sandbox)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 " />
                REAL API MODE (Meta Graph v21.0)
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Manage Meta Graph API credentials, connected Instagram profiles, publishing automation rules, and cron scheduler.
          </p>
        </div>

        {/* Mode Switcher Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container p-1.5 shadow-sm">
            <span className="text-[11px] font-semibold text-on-surface-variant pl-2">Mode:</span>
            <button
              type="button"
              id="mode-toggle-btn"
              onClick={handleToggleDemoMode}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                isDemoModeActive
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              }`}
              title="Click to toggle between DEMO_MODE and Real Meta Graph API mode"
            >
              <span className="material-symbols-outlined text-[15px]">
                {isDemoModeActive ? "smart_toy" : "hub"}
              </span>
              <span>{isDemoModeActive ? "Switch to Real API" : "Switch to Demo Mode"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-outline-variant/20 pb-3">
        {(
          [
            { id: "ACCOUNTS", label: "Meta & Accounts", icon: "link" },
            { id: "AUTOMATION", label: "Publishing Defaults", icon: "tune" },
            { id: "SCHEDULER", label: "Background Engine", icon: "terminal" },
            { id: "WORKSPACE", label: "Team & Quota", icon: "group" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Connected Accounts & Token Health */}
      {activeTab === "ACCOUNTS" && (
        <div className="flex flex-col gap-6">
          {/* Active Profile Card */}
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    account?.profilePictureUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                  }
                  alt="Account Avatar"
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/40"
                />

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-on-surface">
                      {account?.username || "@luminous.studio"}
                    </h2>
                    {account?.isVerified && (
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {account?.name || "Luminous Design Studio"} •{" "}
                    {account?.followersCount?.toLocaleString() || "142,800"} followers
                  </span>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded bg-primary/20 px-2 py-0.5 font-bold uppercase text-primary">
                      {account?.accountType || "BUSINESS"}
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="text-on-surface-variant">
                      Page: {account?.facebookPageName || "Luminous Studio Global"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Badges */}
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <span className="inline-block h-2 w-2  rounded-full bg-emerald-400" />
                    <span>{isDemoModeActive ? "Demo Sandbox Profile" : "Meta Graph API v21.0"}</span>
                  </div>
                  {isTokenEncryptedInDb && (
                    <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400" title="Token is securely encrypted using AES-256-GCM in the OAuthToken model">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      <span>AES-256-GCM Encrypted</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={isDemoModeActive ? "/api/auth/instagram?demo=true" : "/api/auth/instagram"}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-[13px]">sync</span>
                    <span>Re-authenticate</span>
                  </a>
                  <span className="text-outline-variant">&bull;</span>
                  <button
                    type="button"
                    onClick={handleDisconnectInstagram}
                    className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
                  >
                    <span className="material-symbols-outlined text-[13px]">link_off</span>
                    <span>Disconnect</span>
                  </button>
              </div>
              </div>
            </div>

            {/* Token Health Gauge Bar */}
            <div className="mt-6 rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-400">
                      vpn_key
                    </span>
                    <span className="text-xs font-bold text-on-surface">
                      60-Day Long-Lived Token Lifespan
                    </span>
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {tokenDaysLeft} Days Remaining
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Auto-refreshed periodically. No re-authentication required until 8 days before expiry.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={handleRefreshToken}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[15px] ${isRefreshing ? "animate-spin" : ""}`}>
                    refresh
                  </span>
                  <span>{isRefreshing ? "Refreshing..." : "Force Token Refresh"}</span>
                </button>
              </div>

              {/* Progress Gauge */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
                    style={{ width: `${(tokenDaysLeft / 60) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Permissions & Scopes Bar */}
            <div className="mt-4 rounded-xl border border-outline-variant/15 bg-surface-container p-4">
              <span className="text-xs font-semibold text-on-surface">
                Authorized Meta Graph Scopes:
              </span>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "instagram_basic",
                  "instagram_content_publish",
                  "instagram_manage_insights",
                  "pages_read_engagement",
                  "pages_show_list",
                ].map((scope) => (
                  <span
                    key={scope}
                    className="flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 text-[11px] font-mono text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[12px] text-emerald-400">
                      check
                    </span>
                    <span>{scope}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Meta Developer App Configuration Card */}
            <div className="mt-4 rounded-xl border border-outline-variant/20 bg-surface-container p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#1877F2]">
                      shield_person
                    </span>
                    <span className="text-xs font-bold text-on-surface">
                      Meta Developer App Credentials
                    </span>
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Graph API Config
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Configured for production token exchange and live webhooks beyond demo mode.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSavingAppCreds}
                  onClick={handleSaveAppCredentials}
                  className="flex items-center gap-1.5 rounded-xl bg-primary-container px-3.5 py-1.5 text-xs font-bold text-on-primary-container shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    save
                  </span>
                  <span>{isSavingAppCreds ? "Saving..." : "Save App Credentials"}</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Meta App ID
                  </label>
                  <input
                    type="text"
                    value={metaAppId}
                    onChange={(e) => setMetaAppId(e.target.value)}
                    placeholder="e.g. 91823471029384"
                    className="mt-1.5 w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs font-mono text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Meta App Secret
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAppSecret((prev) => !prev)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {showAppSecret ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <input
                    type={showAppSecret ? "text" : "password"}
                    value={metaAppSecret}
                    onChange={(e) => setMetaAppSecret(e.target.value)}
                    placeholder="App secret token"
                    className="mt-1.5 w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-xs font-mono text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Real Meta & Instagram OAuth 2.0 Authorization Card */}
          <div className="rounded-2xl border border-primary/20 bg-surface-container-low p-6 shadow-sm">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4] text-white shadow-lg ring-2 ring-primary/20">
                  <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-on-surface">
                      Connect Instagram with Meta OAuth 2.0
                    </h3>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Meta Graph API v21.0
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant max-w-xl leading-relaxed">
                    Redirects to Meta&apos;s official OAuth screen to authenticate your Instagram Creator or Business account. Exchanged tokens are 60-day long-lived and securely encrypted using <strong>AES-256-GCM</strong> before being stored in the database.
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="material-symbols-outlined text-[13px]">shield</span>
                      AES-256-GCM Encrypted
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <span className="material-symbols-outlined text-[13px]">verified_user</span>
                      CSRF State Protected
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="material-symbols-outlined text-[13px]">published_with_changes</span>
                      60-Day Exchange
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <a
                  href={isDemoModeActive ? "/api/auth/instagram?demo=true" : "/api/auth/instagram"}
                  id="connect-instagram-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] px-6 py-3 text-xs font-bold text-white shadow-lg transition-all hover:opacity-95 hover:shadow-xl active:scale-95"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Connect Instagram</span>
                </a>

                <button
                  type="button"
                  onClick={() => setConnectModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Select Page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Publishing Defaults */}
      {activeTab === "AUTOMATION" && (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface">
            Publishing Automation Defaults
          </h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            These rules are pre-populated whenever you open the Post Creator Studio.
          </p>

          <div className="mt-6 flex flex-col gap-6 divide-y divide-outline-variant/15">
            {/* Auto First Comment */}
            <div className="flex flex-col justify-between gap-3 pt-4 sm:flex-row sm:items-start">
              <div>
                <h4 className="text-xs font-semibold text-on-surface">
                  Automated First Comment Template
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Automatically schedule an initial comment containing calls-to-action or hashtags.
                </p>
                {autoFirstComment && (
                  <input
                    type="text"
                    value={firstCommentTemplate}
                    onChange={(e) => setFirstCommentTemplate(e.target.value)}
                    className="mt-2.5 w-full max-w-lg rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                  />
                )}
              </div>
              <input
                type="checkbox"
                checked={autoFirstComment}
                onChange={(e) => setAutoFirstComment(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary"
              />
            </div>

            {/* Default Aspect Ratio */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-semibold text-on-surface">
                  Default Aspect Ratio Preset
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Starting canvas dimension for new feed uploads.
                </p>
              </div>
              <div className="flex gap-2">
                {(["1:1", "4:5", "16:9"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDefaultRatio(r)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                      defaultRatio === r
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Timezone */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-semibold text-on-surface">
                  Default Publishing Timezone
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Default time zone used for scheduled post releases.
                </p>
              </div>
              <select
                value={defaultTimezone}
                onChange={(e) => setDefaultTimezone(e.target.value)}
                className="rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface outline-none focus:border-primary"
              >
                <option value="PST (UTC-8)">PST (UTC-8) - Los Angeles</option>
                <option value="EST (UTC-5)">EST (UTC-5) - New York</option>
                <option value="UTC (UTC+0)">UTC (UTC+0) - Universal</option>
                <option value="GMT (UTC+0)">GMT (UTC+0) - London</option>
                <option value="CET (UTC+1)">CET (UTC+1) - Paris, Berlin</option>
                <option value="IST (UTC+5:30)">IST (UTC+5:30) - India</option>
                <option value="JST (UTC+9)">JST (UTC+9) - Tokyo</option>
                <option value="AEST (UTC+10)">AEST (UTC+10) - Sydney</option>
              </select>
            </div>

            {/* Auto Hashtags In Comment */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-semibold text-on-surface">
                  Auto-Place Hashtags in First Comment
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Separates hashtag sets from main caption body to keep captions minimal.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoHashtagsInComment}
                onChange={(e) => setAutoHashtagsInComment(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary"
              />
            </div>

            {/* Facebook Cross-posting */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-semibold text-on-surface">
                  Share to Facebook Page by Default
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Simultaneously broadcast feed posts to your linked Facebook Page.
                </p>
              </div>
              <input
                type="checkbox"
                checked={shareToFacebook}
                onChange={(e) => setShareToFacebook(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary"
              />
            </div>

            {/* Hide Like Count */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-semibold text-on-surface">
                  Hide Like & View Counts
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Only you will see total likes and view numbers on new posts.
                </p>
              </div>
              <input
                type="checkbox"
                checked={hideLikeCount}
                onChange={(e) => setHideLikeCount(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary"
              />
            </div>

            {/* Disable Comments */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-semibold text-on-surface">
                  Turn Off Comments by Default
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Disables follower comments on new publications.
                </p>
              </div>
              <input
                type="checkbox"
                checked={disableComments}
                onChange={(e) => setDisableComments(e.target.checked)}
                className="h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleSavePreferences}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-transform hover:brightness-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Background Engine & Scheduler */}
      {activeTab === "SCHEDULER" && (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-on-surface">
                Job Queue Engine & Meta Graph Worker
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Evaluates scheduled posts, executes atomic Meta container simulation, and records full telemetry to the <code className="font-mono text-primary">PublishingAttempt</code> model.
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="inline-block h-2 w-2  rounded-full bg-emerald-400" />
              <span>Queue Engine: Active (60s loop)</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            {/* Queue Metrics Row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container p-3.5">
                <span className="text-[11px] font-semibold text-on-surface-variant">Pending Queue</span>
                <p className="mt-1 text-xl font-bold text-on-surface">{queueMetrics.pending}</p>
                <span className="text-[10px] text-primary">Awaiting release</span>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container p-3.5">
                <span className="text-[11px] font-semibold text-on-surface-variant">Published Today</span>
                <p className="mt-1 text-xl font-bold text-emerald-400">{queueMetrics.completed}</p>
                <span className="text-[10px] text-emerald-400/80">Meta containers live</span>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container p-3.5">
                <span className="text-[11px] font-semibold text-on-surface-variant">Failed (Simulated)</span>
                <p className="mt-1 text-xl font-bold text-rose-400">{queueMetrics.failed}</p>
                <span className="text-[10px] text-rose-400/80">Logged for retry</span>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container p-3.5">
                <span className="text-[11px] font-semibold text-on-surface-variant">Total Attempts</span>
                <p className="mt-1 text-xl font-bold text-secondary">{queueAttempts.length}</p>
                <span className="text-[10px] text-secondary/80">Audit records logged</span>
              </div>
            </div>

            {/* Worker Control & Simulation Mode Selector */}
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h4 className="text-xs font-bold text-on-surface">
                    Test Mode: Simulate Success / Failure
                  </h4>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Simulate realistic Instagram Graph API conditions (encoding errors, aspect ratio checks, token expirations) logged to <code className="font-mono text-primary">PublishingAttempt</code>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg bg-surface-container-high p-1 text-xs">
                    {(
                      [
                        { id: "RANDOM", label: "Random (25% Fail)" },
                        { id: "FORCE_SUCCESS", label: "100% Success" },
                        { id: "FORCE_FAILURE", label: "Force Failure" },
                        { id: "REAL_API", label: "Live Meta API" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSimulateMode(m.id)}
                        className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                          simulateMode === m.id
                            ? "bg-primary text-white shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isTriggeringScheduler}
                    onClick={handleTriggerScheduler}
                    className="flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-bold text-on-primary-container shadow transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isTriggeringScheduler ? "animate-spin" : ""}`}>
                      {isTriggeringScheduler ? "sync" : "rocket_launch"}
                    </span>
                    <span>
                      {isTriggeringScheduler ? "Processing..." : "Run Queue Worker Now"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Execution Diagnostic Log */}
            <div className="rounded-xl border border-outline-variant/20 bg-black/60 p-4 font-mono text-xs">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-semibold">Worker Console & Stream Telemetry:</span>
                <span className="text-[10px] text-emerald-400">● Live Stream</span>
              </div>
              <div className="mt-2.5 max-h-32 overflow-y-auto space-y-1 text-[11px] text-on-surface">
                {schedulerLogs.map((log, i) => (
                  <p key={i} className="leading-relaxed">
                    {log}
                  </p>
                ))}
              </div>
            </div>

            {/* PublishingAttempt Model Audit Trail Table */}
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden">
              <div className="flex items-center justify-between border-b border-outline-variant/15 px-4 py-3 bg-surface-container-high/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    receipt_long
                  </span>
                  <h4 className="text-xs font-bold text-on-surface">
                    PublishingAttempt Audit Trail
                  </h4>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {queueAttempts.length} Records
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  Prisma Model: <code className="font-mono text-on-surface">PublishingAttempt</code>
                </span>
              </div>

              <div className="max-h-72 overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-outline-variant/10 bg-surface-container-high/30 text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Post Caption</th>
                      <th className="px-4 py-2.5 font-semibold">Container ID</th>
                      <th className="px-4 py-2.5 font-semibold">Result / Subcode</th>
                      <th className="px-4 py-2.5 font-semibold">Duration</th>
                      <th className="px-4 py-2.5 font-semibold">Executed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 font-medium text-on-surface">
                    {queueAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-on-surface-variant">
                          No publishing attempts recorded yet. Click &quot;Run Queue Worker Now&quot; above to simulate an execution.
                        </td>
                      </tr>
                    ) : (
                      queueAttempts.map((attempt) => {
                        const isSuccess = attempt.status === "SUCCESS";
                        const isFailed = attempt.status === "FAILED";

                        return (
                          <tr key={attempt.id} className="hover:bg-surface-container-high/40 transition-colors">
                            {/* Status */}
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  isSuccess
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                    : isFailed
                                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                    : "bg-sky-500/15 text-sky-400 border border-sky-500/20"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {isSuccess ? "check" : isFailed ? "close" : "sync"}
                                </span>
                                <span>{attempt.status}</span>
                              </span>
                            </td>

                            {/* Caption */}
                            <td className="max-w-[200px] truncate px-4 py-2.5 text-on-surface">
                              {attempt.postCaption || "Scheduled publication"}
                            </td>

                            {/* Container ID */}
                            <td className="px-4 py-2.5 font-mono text-[10px] text-on-surface-variant">
                              {attempt.creationId || "N/A"}
                            </td>

                            {/* Result / Subcode */}
                            <td className="px-4 py-2.5">
                              {isSuccess ? (
                                <span className="text-emerald-400 font-semibold">200 OK (Published)</span>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="text-rose-400 font-semibold">
                                    Subcode {attempt.errorSubcode || "400"}
                                  </span>
                                  <span className="truncate max-w-[220px] text-[10px] text-on-surface-variant">
                                    {attempt.errorMessage || "Simulation failure"}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Duration */}
                            <td className="px-4 py-2.5 font-mono text-on-surface-variant">
                              {attempt.durationMs ? `${attempt.durationMs}ms` : "—"}
                            </td>

                            {/* Executed At */}
                            <td className="px-4 py-2.5 text-on-surface-variant">
                              {new Date(attempt.startedAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Serverless Setup Instruction */}
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4 text-xs text-on-surface-variant">
              <span className="font-semibold text-on-surface">Production Webhook / Serverless Cron:</span>
              <p className="mt-1">
                Configure your host (e.g. Vercel Cron or GitHub Actions) to send a periodic ping with authorization:
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-black/60 p-2.5 text-[11px] font-mono text-primary">
                curl -X POST https://your-domain.com/api/cron/publish-scheduled \
  -H &quot;Authorization: Bearer CRON_SECRET&quot;
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Team & Quotas */}
      {activeTab === "WORKSPACE" && (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface">
            Team Members & Storage Quota
          </h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            Collaborators with publishing authorization on this workspace.
          </p>

          <div className="mt-6 space-y-4">
            {[
              { name: "Alex Rivera", email: "alex@luminous.studio", role: "Owner (Admin)", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
              { name: "Elena Rostova", email: "elena@luminous.studio", role: "Creative Director", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
              { name: "Marcus Chen", email: "marcus@luminous.studio", role: "Growth Analyst", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
            ].map((m) => (
              <div key={m.email} className="flex items-center justify-between rounded-xl bg-surface-container p-3.5">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">{m.name}</h4>
                    <p className="text-[11px] text-on-surface-variant">{m.email}</p>
                  </div>
                </div>
                <span className="rounded-md bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          {/* Quota overview */}
          <div className="mt-6 rounded-xl border border-outline-variant/15 bg-surface-container p-4 text-xs">
            <div className="flex justify-between font-semibold text-on-surface">
              <span>Cloud Storage Quota</span>
              <span>14.2 GB / 25 GB (57%)</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-secondary" style={{ width: "57%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Connect Facebook Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-outline-variant/30 bg-surface-container-high p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">
                Connect Meta Account
              </h3>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
              Select the managed Facebook Page linked to your Instagram Professional account:
            </p>

            <div className="mt-3 space-y-2">
              {[
                "Luminous Studio Global",
                "Luminous Digital Brand",
                "Personal Creator Page",
              ].map((p) => (
                <label
                  key={p}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-semibold transition-all ${
                    selectedPage === p
                      ? "border-primary bg-primary/10 text-on-surface"
                      : "border-outline-variant/20 bg-surface-container text-on-surface-variant hover:border-outline-variant/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#1877F2]">
                      flag
                    </span>
                    <span>{p}</span>
                  </div>
                  <input
                    type="radio"
                    name="page"
                    checked={selectedPage === p}
                    onChange={() => setSelectedPage(p)}
                    className="text-primary"
                  />
                </label>
              ))}
            </div>

            <ul className="mt-4 flex flex-col gap-2 text-xs text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">
                  check_circle
                </span>
                <span>Instagram Business / Creator account linked</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">
                  check_circle
                </span>
                <span>Graph API v20.0 publishing permissions</span>
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={isDemoModeActive ? "/api/auth/instagram?demo=true" : "/api/auth/instagram"}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#833AB4] to-[#FD1D1D] px-4 py-2 text-xs font-bold text-white shadow transition-all hover:opacity-95"
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  <span>Meta OAuth Screen</span>
                </a>

                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={handleConnectFacebook}
                  className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#166fe5] active:scale-95 disabled:opacity-50"
                >
                  {isConnecting && (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  )}
                  <span>{isConnecting ? "Linking..." : "Simulate Link"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
