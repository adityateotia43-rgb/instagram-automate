import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InstaFlow Studio - Instagram Content Command & Automation",
  description:
    "Architectural publishing workstation for creators, agencies, and high-velocity social brands. Direct Meta Graph API v21.0 integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`}
    >
      <body className="bg-background font-sans text-on-surface antialiased selection:bg-[#FF4D36]/20 selection:text-[#FF4D36]">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
