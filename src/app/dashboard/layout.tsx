"use client";

import React, { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Left Navigation Sidebar with responsive collapse */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Studio Area */}
      <div className="pl-0 transition-all duration-300 md:pl-[260px]">
        {/* Top Header */}
        <Header onMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />

        {/* Content Area */}
        <main className="relative min-h-screen bg-background pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
