"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export const TopNav = () => {
  const { connected, publicKey, wallet, disconnect } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      const fetchProfile = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
          const res = await fetch(`${apiUrl}/api/users/${publicKey.toBase58()}/markets`);
          const data = await res.json();
          if (data.success && data.userProfile?.avatarUrl) {
            setAvatarUrl(data.userProfile.avatarUrl);
          }
        } catch (e) {
          console.error("Failed to fetch user profile avatar:", e);
        }
      };
      fetchProfile();
    } else {
      setAvatarUrl(null);
    }
  }, [connected, publicKey]);

  return (
    <header className="border-b border-color-border bg-[#07090c] sticky top-0 z-50">
      <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <img src="/logo.png" alt="PumpSocial Logo" className="w-8 h-8 object-contain" />
            <span>PumpSocial</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-color-muted">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Markets
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
          {mounted && connected && publicKey ? (
            <div className="flex items-center gap-3">
              <Link href={`/profile/${publicKey.toBase58()}`} className="relative group block" title="Go to Profile">
                <div className="w-10 h-10 rounded-full bg-[#161A22] border border-color-border overflow-hidden group-hover:border-indigo-500 transition-colors">
                  <img 
                    src={avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey.toBase58()}`} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {wallet?.adapter?.icon && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#07090c] flex items-center justify-center">
                    <img 
                      src={wallet.adapter.icon} 
                      alt={wallet.adapter.name} 
                      className="w-4 h-4 rounded-full"
                    />
                  </div>
                )}
              </Link>
              <button 
                onClick={() => disconnect()}
                className="text-color-muted hover:text-red-400 transition-colors"
                title="Disconnect"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
            </div>
          ) : (
            <WalletMultiButton className="!bg-color-buy !text-[#07090c] !font-sans !font-semibold !text-sm !h-9 !px-5 !rounded-full hover:!opacity-90 transition-opacity" />
          )}
        </div>
      </div>
    </header>
  );
};
