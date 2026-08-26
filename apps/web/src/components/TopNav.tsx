"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export const TopNav = () => {
  return (
    <header className="border-b border-color-border bg-[#0B0E14] sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <div className="w-6 h-6 rounded-sm bg-color-buy flex items-center justify-center transform rotate-45">
              <div className="w-3 h-3 bg-[#0B0E14] rounded-sm transform -rotate-45" />
            </div>
            <span>PumpSocial</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-color-muted">
            <Link href="/" className="hover:text-white transition-colors">
              Markets
            </Link>
            <Link href="/portfolio" className="hover:text-white transition-colors">
              Portfolio
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
