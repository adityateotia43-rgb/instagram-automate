"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export interface HeaderProps {
workspaceParent?: string;
workspaceName?: string;
timezone?: string;
searchValue?: string;
onSearchChange?: (value: string) => void;
hasUnreadNotifications?: boolean;
onMenuToggle?: () => void;
}

export default function Header({
workspaceParent = "Studio",
workspaceName = "Workspace",
timezone = "PST (UTC-8)",
searchValue = "",
onSearchChange,
hasUnreadNotifications = true,
onMenuToggle,
}: HeaderProps) {
const { data: session } = useSession();
const [internalSearch, setInternalSearch] = useState(searchValue);
const [profileMenuOpen, setProfileMenuOpen] = useState(false);

const userName = session?.user?.name || "Elena Vance";
const userRole = session?.user?.role || "Lead Strategist";
const userEmail = session?.user?.email || "elena.vance@instaflow.studio";
const avatarUrl =
session?.user?.image ||
"https://lh3.googleusercontent.com/aida-public/AB6AXuBpyJbDc0Js2GphKVrifcw-ZwYG5SgXqyUVY5rprcwdcflubuNGAZP1zHfuLjjGljMW6WdSxrIZ__iriIzeflMNQ_QUFS34GmquZgn7rOvG6wFod4uJVsEbmwAzmc1aJOam2nLjGVq82bz05crttJ6qR4SQG94GeCpEhNSEEgMP9Mkk7CxWzuBAGDqTxqMqYmuDkWEmX0xk3q_LEa1KPOXSNuaYdH6OYr0mkpuiydooG_EYElzUIgTT";

const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
const val = e.target.value;
setInternalSearch(val);
if (onSearchChange) {
onSearchChange(val);
}
};

return (
<header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-surface/85 px-space-md shadow-[0_1px_8px_rgba(0,0,0,0.1)] backdrop-blur-xl md:left-[260px] md:px-space-lg">
{/* Left Area: Mobile Hamburger, Breadcrumbs & Search */}
<div className="flex max-w-xl flex-1 items-center gap-space-sm sm:gap-space-md">
{/* Mobile Hamburger Toggle */}
<button
type="button"
onClick={onMenuToggle}
className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:hidden"
aria-label="Toggle navigation menu"
>
<span className="material-symbols-outlined text-[22px]">menu</span>
</button>

<div className="hidden items-center gap-1.5 text-xs text-on-surface-variant sm:flex">
<span className="cursor-pointer transition-colors hover:text-on-surface">
{workspaceParent}
</span>
<span className="text-outline">/</span>
<span className="font-semibold text-on-surface">{workspaceName}</span>
</div>

<div className="relative max-w-sm flex-1">
<span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
search
</span>
<input
type="text"
value={internalSearch}
onChange={handleSearch}
placeholder="Search posts, media, tags..."
className="h-9 w-full rounded-lg bg-surface-container pl-9 pr-12 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
/>
<div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
⌘K
</div>
</div>
</div>

{/* Right Area: Timezone, Team, Notifications, Profile */}
<div className="flex items-center gap-space-md">
{/* Timezone Switcher */}
<div className="hidden cursor-pointer items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1.5 text-xs text-on-surface-variant transition-colors hover:text-on-surface lg:flex">
<span className="material-symbols-outlined text-[16px]">
schedule
</span>
<span>{timezone}</span>
<span className="material-symbols-outlined text-[14px]">
expand_more
</span>
</div>

{/* Team Avatars */}
<div className="hidden items-center -space-x-1.5 md:flex">
<div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-highest text-[10px] font-bold text-on-surface">
EM
</div>
<div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-on-surface">
TK
</div>
<div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-[10px] text-on-surface-variant">
+3
</div>
</div>

{/* Notifications Icon Button */}
<button
type="button"
className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
>
<span className="material-symbols-outlined text-[20px]">
notifications
</span>
{hasUnreadNotifications && (
<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-container ring-2 ring-surface" />
)}
</button>

{/* Profile Element & Dropdown Menu */}
<div className="relative">
<div
onClick={() => setProfileMenuOpen(!profileMenuOpen)}
className="flex cursor-pointer select-none items-center gap-space-sm pl-space-xs"
>
{/* eslint-disable-next-line @next/next/no-img-element */}
<img
src={avatarUrl}
alt={userName}
className="h-8 w-8 rounded-full object-cover"
/>
<div className="hidden flex-col text-left sm:flex">
<span className="text-xs font-semibold leading-none text-on-surface">
{userName}
</span>
<span className="mt-0.5 text-[10px] leading-none text-on-surface-variant">
{userRole}
</span>
</div>
<span className="material-symbols-outlined hidden text-[16px] text-on-surface-variant sm:block">
expand_more
</span>
</div>

{/* User Profile Dropdown Menu */}
{profileMenuOpen && (
<div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-800 bg-surface-container-high p-2 shadow-2xl backdrop-blur-xl">
<div className="border-b border-neutral-700/60 px-3 py-2">
<p className="text-xs font-semibold text-white">{userName}</p>
<p className="truncate text-[11px] text-neutral-400">
{userEmail}
</p>
</div>
<button
type="button"
onClick={() => signOut({ callbackUrl: "/auth/login" })}
className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-neutral-800/80 hover:text-red-300"
>
<span className="material-symbols-outlined text-[16px]">
logout
</span>
<span>Sign Out</span>
</button>
</div>
)}
</div>
</div>
</header>
);
}
