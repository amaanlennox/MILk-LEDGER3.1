"use client";

import Link from "next/link";
import { HeaderActions } from "@/components/HeaderActions";
import { useAppContext } from "@/context/AppContext";

export function Header() {
  const { t } = useAppContext();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#02182B] backdrop-blur supports-[backdrop-filter]:bg-[#02182B]/90">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3" />
            <path d="M22 13h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4" />
            <path d="M18 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          </svg>
          <span className="font-black text-lg tracking-tight text-white uppercase italic">{t('appName')}</span>
        </Link>
        <div className="flex items-center">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}