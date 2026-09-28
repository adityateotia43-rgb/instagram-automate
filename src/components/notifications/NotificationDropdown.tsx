"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MockNotification } from "@/lib/demo/mockData";
import { useToast } from "@/components/providers/ToastProvider";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const router = useRouter();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "PUBLISHING" | "SYSTEM">("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notificationsApiResponse = await fetch("/api/notifications");
      if (notificationsApiResponse.ok) {
        const notificationsPayload = await notificationsApiResponse.json();
        if (notificationsPayload.success && Array.isArray(notificationsPayload.notifications)) {
          setNotifications(notificationsPayload.notifications);
          const unread = notificationsPayload.notifications.filter((n: MockNotification) => !n.isRead).length;
          if (onUnreadCountChange) onUnreadCountChange(unread);
        }
      }
    } catch (err) {
      console.warn("[NotificationDropdown] Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    if (onUnreadCountChange) onUnreadCountChange(unread);
  }, [notifications, onUnreadCountChange]);

  useEffect(() => {
    const handleDismissDropdownOnOutsideClick = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleDismissDropdownOnOutsideClick);
    return () => document.removeEventListener("mousedown", handleDismissDropdownOnOutsideClick);
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      toast.success("All notifications marked as read");
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleClearRead = async () => {
    try {
      const readCount = notifications.filter((n) => n.isRead).length;
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.info(`Cleared ${readCount} read notifications`);
      await fetch("/api/notifications?clearRead=true", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
    }
  };

  const handleNotificationClick = (notif: MockNotification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      onClose();
      router.push(notif.link);
    }
  };

  // Simulate alert (Test helper for evaluation & live testing)
  const handleSimulateAlert = async () => {
    const alertTypes: Array<{
      type: MockNotification["type"];
      title: string;
      message: string;
      link: string;
      toastTitle: string;
    }> = [
      {
        type: "POST_PUBLISHED",
        title: "Carousel Published to Instagram",
        message: "Post #18029384918234812 is live on @luminous.studio with 10 slides.",
        link: "/dashboard/activity",
        toastTitle: "Post Published Live",
      },
      {
        type: "SCHEDULED_REMINDER",
        title: "Queue Alert: Upcoming Post",
        message: "Scheduled post 'Minimalist Typography Grid' will publish in 15 minutes.",
        link: "/dashboard/scheduled",
        toastTitle: "Scheduled Execution",
      },
      {
        type: "TOKEN_EXPIRING",
        title: "Security: Token Refresh Notice",
        message: "Meta Graph API token requires health verification within 5 days.",
        link: "/dashboard/settings",
        toastTitle: "OAuth Health Notice",
      },
    ];

    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: randomAlert.type,
          title: randomAlert.title,
          message: randomAlert.message,
          link: randomAlert.link,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.notification) {
          setNotifications((prev) => [data.notification, ...prev]);
        }
      }

      toast.info(randomAlert.message, randomAlert.toastTitle, {
        label: "View",
        onClick: () => router.push(randomAlert.link),
      });
    } catch (err) {
      console.error("Failed to simulate alert:", err);
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (isNaN(diffSec) || diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 172800) return "Yesterday";
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return "Recent";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "PUBLISHING")
      return (
        n.type === "POST_PUBLISHED" ||
        n.type === "POST_FAILED" ||
        n.type === "SCHEDULED_REMINDER"
      );
    if (filter === "SYSTEM")
      return (
        n.type === "TOKEN_EXPIRING" ||
        n.type === "TOKEN_EXPIRED" ||
        n.type === "ACCOUNT_DISCONNECTED" ||
        n.type === "SYSTEM"
      );
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications center"
      className="absolute right-0 top-12 z-50 w-[360px] sm:w-[410px] rounded-2xl border border-slate-700/70 bg-[#0F172A]/95 p-0 shadow-2xl backdrop-blur-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-3"
    >
      {/* Dropdown Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            notifications_active
          </span>
          <h3 className="text-sm font-bold text-white">Notifications</h3>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/30">
              {unreadCount} new
            </span>
          ) : (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
              All read
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              title="Mark all notifications as read"
            >
              <span className="material-symbols-outlined text-[14px]">
                done_all
              </span>
              <span>Mark all read</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close notification dropdown"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 px-3 py-2 bg-[#0D1424]">
        {[
          { id: "ALL", label: "All", count: notifications.length },
          { id: "UNREAD", label: "Unread", count: unreadCount },
          { id: "PUBLISHING", label: "Publishing" },
          { id: "SYSTEM", label: "System" },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-slate-700/70 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    tab.id === "UNREAD"
                      ? "bg-primary text-black"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List Body */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <span className="material-symbols-outlined animate-spin text-[24px]">
              progress_activity
            </span>
            <p className="mt-2 text-xs">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-400">
              <span className="material-symbols-outlined text-[24px]">
                notifications_off
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-200">
              No notifications here
            </p>
            <p className="mt-1 text-[11px] text-slate-400 max-w-xs">
              {filter === "UNREAD"
                ? "You are completely caught up! No unread notifications pending."
                : "No notifications matching this category."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isPublished = notif.type === "POST_PUBLISHED";
            const isReminder = notif.type === "SCHEDULED_REMINDER";
            const isToken = notif.type === "TOKEN_EXPIRING" || notif.type === "TOKEN_EXPIRED";
            const isFailed = notif.type === "POST_FAILED";

            const icon = isPublished
              ? "verified"
              : isReminder
              ? "schedule"
              : isToken
              ? "key"
              : isFailed
              ? "error"
              : "info";

            const iconStyle = isPublished
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : isReminder
              ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
              : isToken
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : isFailed
              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
              : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative flex items-start gap-3 p-3.5 transition-all cursor-pointer ${
                  !notif.isRead
                    ? "bg-slate-800/50 hover:bg-slate-800/80"
                    : "hover:bg-slate-800/30 opacity-80 hover:opacity-100"
                }`}
              >
                {/* Category Icon */}
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${iconStyle}`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-1">
                    <h4
                      className={`text-xs truncate ${
                        !notif.isRead
                          ? "font-bold text-white"
                          : "font-semibold text-slate-300"
                      }`}
                    >
                      {notif.title}
                    </h4>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Deep link indicator */}
                  {notif.link && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-primary group-hover:underline">
                      <span>View details</span>
                      <span className="material-symbols-outlined text-[12px]">
                        arrow_forward
                      </span>
                    </span>
                  )}
                </div>

                {/* Unread dot or Action controls */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  {!notif.isRead ? (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      title="Delete notification"
                      className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:text-rose-400 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        delete
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="flex items-center justify-between border-t border-slate-700/60 px-3.5 py-2.5 bg-[#0D1424]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/dashboard/activity");
            }}
            className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">
              history
            </span>
            <span>All activity</span>
          </button>

          {notifications.some((n) => n.isRead) && (
            <button
              type="button"
              onClick={handleClearRead}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear read
            </button>
          )}
        </div>

        {/* Test Alert Simulator */}
        <button
          type="button"
          onClick={handleSimulateAlert}
          className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
          title="Simulate a live notification arriving in real-time"
        >
          <span className="material-symbols-outlined text-[13px]">
            bolt
          </span>
          <span>Simulate Alert</span>
        </button>
      </div>
    </div>
  );
}
