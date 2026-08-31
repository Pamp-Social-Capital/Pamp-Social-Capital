"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export const TopNav = () => {
  return (
    <header className="border-b border-color-border bg-[#0B0E14] sticky top-0 z-50">
      <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <div className="w-6 h-6 rounded-sm bg-color-buy flex items-center justify-center transform rotate-45">
              <div className="w-3 h-3 bg-[#0B0E14] rounded-sm transform -rotate-45" />
            </div>
            <span>PumpSocial</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-color-muted">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Markets
            </Link>
            <Link href="/portfolio" className="hover:text-white transition-colors">
              Portfolio
            </Link>
            <Link href="/protocol" className="hover:text-white transition-colors">
              Protocol
            </Link>
            <Link href="/claim" className="flex items-center gap-1 hover:text-white transition-colors text-color-buy">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create Market
            </Link>
          </nav>
        </div>

        {/* Right Side: Wallet */}
        <div className="flex items-center gap-6">
          <WalletMultiButton className="!bg-color-buy !text-[#0B0E14] !font-sans !font-semibold !text-sm !h-9 !px-5 !rounded-full hover:!opacity-90 transition-opacity" />
        </div>
      </div>
    </header>
  );
};
