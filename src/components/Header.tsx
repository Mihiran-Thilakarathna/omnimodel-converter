"use client";

import { Network } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNavigationBar() {
  const currentRoute = usePathname();

  // Helper function to check active path
  const checkActive = (path: string) => currentRoute === path;

  return (
    <header className="w-full flex items-center justify-between px-8 md:px-16 lg:px-24 py-8 absolute top-0 left-0 z-50">

      {/* Application Branding */}
      <div className="flex items-center gap-2 w-[200px]">
        <Network className="w-6 h-6 text-white" />
        <span className="font-bold text-xl tracking-tight text-white">
          OmniModel
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex items-center justify-center gap-10 text-[14px] font-medium text-[#a1a1aa]">
        <Link
          href="/"
          className={`relative hover:text-white transition-colors flex flex-col items-center ${checkActive("/") ? "text-white" : ""}`}
        >
          <span>Home</span>
          {checkActive("/") && (
            <div className="absolute -bottom-4 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]" />
          )}
        </Link>
        <Link
          href="/about"
          className={`relative hover:text-white transition-colors flex flex-col items-center ${checkActive("/about") ? "text-white" : ""}`}
        >
          <span>About</span>
          {checkActive("/about") && (
            <div className="absolute -bottom-4 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]" />
          )}
        </Link>
        <Link
          href="/help"
          className={`relative hover:text-white transition-colors flex flex-col items-center ${checkActive("/help") ? "text-white" : ""}`}
        >
          <span>Help</span>
          {checkActive("/help") && (
            <div className="absolute -bottom-4 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]" />
          )}
        </Link>
      </nav>

      {/* Layout spacer */}
      <div className="w-[200px]" />
    </header>
  );
}
