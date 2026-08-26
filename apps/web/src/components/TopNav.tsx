"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export const TopNav = () => {
  return (
    <header className="border-b border-color-border bg-color-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-tighter text-color-foreground">
            [PUMP SOCIAL CAPITAL]
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-color-muted">
            <Link href="/" className="hover:text-color-foreground transition-colors">
              [MARKETS]
            </Link>
            <Link href="/portfolio" className="hover:text-color-foreground transition-colors">
              [PORTFOLIO]
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <WalletMultiButton className="!bg-color-foreground !text-color-background !font-mono !font-bold !rounded-none !px-4 hover:!bg-color-muted transition-colors" />
        </div>
      </div>
    </header>
  );
};
