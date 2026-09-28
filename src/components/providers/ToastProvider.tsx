"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 or negative for persistent
  action?: ToastAction;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions | string) => string;
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, action?: ToastAction) => string;
    error: (message: string, title?: string, action?: ToastAction) => string;
    info: (message: string, title?: string, action?: ToastAction) => string;
    warning: (message: string, title?: string, action?: ToastAction) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions | string): string => {
      const toastData: ToastOptions =
        typeof options === "string" ? { message: options } : options;

      const id = toastData.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const duration = toastData.duration !== undefined ? toastData.duration : 4500;
      const type = toastData.type || "info";

      const newItem: ToastItem = {
        ...toastData,
        id,
        type,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newItem]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const toastHelpers = {
    success: (message: string, title?: string, action?: ToastAction) =>
      showToast({ type: "success", message, title: title || "Success", action }),
    error: (message: string, title?: string, action?: ToastAction) =>
      showToast({ type: "error", message, title: title || "Error", action }),
    info: (message: string, title?: string, action?: ToastAction) =>
      showToast({ type: "info", message, title: title || "Notice", action }),
    warning: (message: string, title?: string, action?: ToastAction) =>
      showToast({ type: "warning", message, title: title || "Warning", action }),
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        toast: toastHelpers,
      }}
    >
      {children}

      {/* Floating Toast Notification Stack */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm w-full flex-col gap-2.5 sm:bottom-6 sm:right-6"
      >
        {toasts.map((toastNotice) => {
          const isSuccess = toastNotice.type === "success";
          const isError = toastNotice.type === "error";
          const isWarning = toastNotice.type === "warning";

          const icon = isSuccess
            ? "check_circle"
            : isError
            ? "error"
            : isWarning
            ? "warning"
            : "info";

          const iconContainerStyle = isSuccess
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : isError
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
            : isWarning
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
            : "bg-sky-500/10 text-sky-400 border-sky-500/20";

          const borderAccent = isSuccess
            ? "hover:border-emerald-500/40"
            : isError
            ? "hover:border-rose-500/40"
            : isWarning
            ? "hover:border-amber-500/40"
            : "hover:border-sky-500/40";

          return (
            <div
              key={toastNotice.id}
              role="status"
              className={`pointer-events-auto relative flex w-full items-start gap-3 rounded-2xl border border-slate-700/60 bg-[#0F172A]/95 p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300 ${borderAccent}`}
            >
              {/* Status Icon */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${iconContainerStyle}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {icon}
                </span>
              </div>

              {/* Message Content */}
              <div className="flex-1 pr-1">
                {toastNotice.title && (
                  <h4 className="text-xs font-bold text-white">
                    {toastNotice.title}
                  </h4>
                )}
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                  {toastNotice.message}
                </p>

                {toastNotice.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toastNotice.action?.onClick();
                      dismissToast(toastNotice.id);
                    }}
                    className="mt-2 text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary-container transition-colors"
                  >
                    {toastNotice.action.label}
                  </button>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => dismissToast(toastNotice.id)}
                className="shrink-0 text-slate-400 transition-colors hover:text-white"
                aria-label="Close notification"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
