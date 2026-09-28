"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  currentAccount?: {
    username: string;
    followers: string;
    avatarLetter: string;
    isVerified: boolean;
  };
  storageUsedGb?: number;
  storageTotalGb?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: "grid_view" },
  { label: "Create Post", path: "/dashboard/create", icon: "add_box" },
  { label: "Calendar", path: "/dashboard/calendar", icon: "calendar_month" },
  { label: "Scheduled", path: "/dashboard/scheduled", icon: "schedule" },
  { label: "Drafts", path: "/dashboard/drafts", icon: "draft" },
  { label: "Media Library", path: "/dashboard/media", icon: "photo_library" },
  { label: "Analytics", path: "/dashboard/analytics", icon: "insights" },
  { label: "Activity", path: "/dashboard/activity", icon: "notifications" },
  { label: "Settings", path: "/dashboard/settings", icon: "settings" },
];

export default function Sidebar({
  currentAccount = {
    username: "@luminous.studio",
    followers: "142.8k followers",
    avatarLetter: "L",
    isVerified: true,
  },
  storageUsedGb = 14.2,
  storageTotalGb = 25,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const storagePercent = Math.round((storageUsedGb / storageTotalGb) * 100);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col justify-between bg-surface-container-low py-space-md shadow-[0_1px_8px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-space-md">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-space-md">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center gap-space-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FF4D36] text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold leading-none tracking-tight text-on-surface">
                  InstaFlow
                </span>
                <span className="mt-0.5 text-xs text-on-surface-variant">
                  Studio
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Pro
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface md:hidden"
                aria-label="Close navigation"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

        {/* Account Switcher Button */}
        <div className="px-space-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl bg-surface-container p-space-sm transition-colors hover:bg-surface-container-high"
          >
            <div className="flex min-w-0 items-center gap-space-sm">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
                {currentAccount.avatarLetter}
              </div>
              <div className="flex flex-col truncate text-left">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-semibold text-on-surface">
                    {currentAccount.username}
                  </span>
                  {currentAccount.isVerified && (
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      verified
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  {currentAccount.followers}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              unfold_more
            </span>
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="px-space-sm">
          <Link
            href="/dashboard/create"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-space-sm rounded-xl bg-primary-container px-space-md py-2.5 text-sm font-semibold text-on-primary-container shadow-[0_0_20px_-3px_rgba(255,76,131,0.4)] transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Create Post</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-0.5 px-space-sm">
          {navItems.map((navLink) => {
            const isActive =
              pathname === navLink.path ||
              (navLink.path === "/dashboard" && pathname === "/dashboard");
            return (
              <Link
                key={navLink.path}
                href={navLink.path}
                onClick={onClose}
                className={`flex items-center gap-space-sm rounded-xl px-space-md py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-surface-container-high font-semibold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {navLink.icon}
                </span>
                <span>{navLink.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Storage Indicator */}
      <div className="flex flex-col gap-space-sm px-space-md">
        <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container p-space-sm">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Cloud Storage</span>
            <span className="font-semibold text-on-surface">
              {storagePercent}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <span className="text-[11px] text-on-surface-variant">
            {storageUsedGb} GB of {storageTotalGb} GB used
          </span>
        </div>
      </div>
    </aside>
    </>
  );
}
