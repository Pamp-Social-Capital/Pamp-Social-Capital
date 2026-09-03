"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useRef } from "react";
import bs58 from "bs58";
import toast from "react-hot-toast";
import { useSocialCapital } from "../hooks/useSocialCapital";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export const TopNav = () => {
  const { connected, publicKey, wallet, disconnect, signMessage } = useWallet();
  
  const getAvatarStyle = (seed: string) => {
    const styles = ["adventurer", "big-ears", "bottts", "bottts-neutral", "critters", "pixel-art", "voxel-art", "voxel-bot"];
    let hash = 0;
    for (let i = 0; i < Math.min(seed.length, 5); i++) hash += seed.charCodeAt(i);
    return styles[hash % styles.length];
  };
  const [mounted, setMounted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const authPromptedRef = useRef(false);
  
  const sdk = useSocialCapital();
  const [totalKeys, setTotalKeys] = useState<number>(0);

  useEffect(() => {
    if (!publicKey || !sdk) {
      setTotalKeys(0);
      return;
    }
    const fetchTotalKeys = async () => {
      try {
        const positions = await sdk.program.account.userPosition.all([
          {
            memcmp: {
              offset: 8,
              bytes: publicKey.toBase58(),
            },
          },
        ]);
        const sum = positions.reduce((acc: number, pos: any) => acc + pos.account.keyBalance.toNumber(), 0);
        setTotalKeys(sum);
      } catch (err) {
        console.error("Failed to fetch total keys", err);
      }
    };
    fetchTotalKeys();
    const interval = setInterval(fetchTotalKeys, 5000);
    return () => clearInterval(interval);
  }, [publicKey, sdk]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      const authenticateAndFetch = async () => {
        let token = localStorage.getItem("walletToken");
        
        // Clear stale token
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.wallet !== publicKey.toBase58()) {
              localStorage.removeItem("walletToken");
              token = null;
            }
          } catch (e) {
            localStorage.removeItem("walletToken");
            token = null;
          }
        }

        // Trigger Sign Message if no valid token
        if (!token && signMessage && !authPromptedRef.current && !isAuthenticating) {
          authPromptedRef.current = true;
          setIsAuthenticating(true);
          const loadingId = toast.loading("Please sign the message to authenticate...");
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            const challengeRes = await fetch(`${apiUrl}/api/auth/challenge?wallet=${publicKey.toBase58()}`);
            const challengeData = await challengeRes.json();
            if (!challengeData.success) throw new Error("Failed to get challenge");
            
            const messageUint8 = new TextEncoder().encode(challengeData.message);
            const signature = await signMessage(messageUint8);
            
            const verifyRes = await fetch(`${apiUrl}/api/auth/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                wallet: publicKey.toBase58(),
                message: challengeData.message,
                signature: bs58.encode(signature)
              })
            });
            
            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error("Verify failed");
            
            localStorage.setItem("walletToken", verifyData.token);
            token = verifyData.token;
            toast.success("Wallet authenticated successfully!", { id: loadingId });
          } catch (e) {
            console.error("Auth error:", e);
            toast.error("Authentication required to use this app", { id: loadingId });
            disconnect();
          } finally {
            setIsAuthenticating(false);
            authPromptedRef.current = false;
          }
        }

        // Fetch profile
        if (token) {
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
        }
      };

      authenticateAndFetch();
    } else {
      setAvatarUrl(null);
    }
  }, [connected, publicKey, signMessage, disconnect, isAuthenticating]);

  return (
    <header className="border-b border-color-border bg-background sticky top-0 z-50">
      <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <img src="/logo.png" alt="PumpSocial Logo" className="w-8 h-8 object-contain" />
            <span>PumpSocial</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-color-muted">
            <Link href="/explore" className="hover:text-white transition-colors">
              Explore
            </Link>
            <Link href="/protocol" className="hover:text-white transition-colors">
              Protocol
            </Link>
            
            {/* Search Form */}
            <div className="relative flex items-center ml-4 group">
              <div className="absolute left-3 flex items-center justify-center pointer-events-none text-color-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search for coins and users..." 
                className="w-80 h-10 pl-9 pr-14 text-sm text-white bg-[#1A1D18] border border-transparent rounded-lg outline-none transition-all placeholder:text-color-muted focus:border-[#2A3028]" 
              />
            </div>
          </nav>
        </div>

        {/* Right Side: Wallet & Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-3">
            <Link 
              href="/claim" 
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-color-buy text-color-buy hover:bg-color-buy/10 transition-colors text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Create Market
            </Link>
            {mounted && connected && publicKey && (
              <div className="flex flex-col items-start ml-1">
                <span className="text-[10px] font-bold text-color-muted uppercase tracking-wider">Total Keys</span>
                <span className="text-sm font-semibold text-white bg-white/5 px-2 py-0.5 rounded border border-color-border">{totalKeys}</span>
              </div>
            )}
          </div>
          {mounted && connected && publicKey ? (
            <div className="flex items-center gap-3">
              <Link href={`/profile/${publicKey.toBase58()}`} className="relative group block" title="Go to Profile">
                <div className="w-10 h-10 rounded-full bg-[#161A22] border border-color-border overflow-hidden group-hover:border-indigo-500 transition-colors">
                  <img 
                    src={avatarUrl || `https://api.dicebear.com/10.x/${getAvatarStyle(publicKey.toBase58())}/svg?seed=${publicKey.toBase58()}`} 
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
                onClick={() => setShowDisconnectModal(true)}
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

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07090c]/80 backdrop-blur-sm">
          <div className="bg-[#161A22] border border-color-border rounded-2xl p-6 w-[90%] max-w-sm flex flex-col gap-4 text-center shadow-2xl">
            <h3 className="text-xl font-bold text-white">Disconnect Wallet?</h3>
            <p className="text-color-muted text-sm leading-relaxed">
              Are you sure you want to log out? You will need to sign a message to authenticate again when you reconnect.
            </p>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setShowDisconnectModal(false)}
                className="flex-1 bg-[#07090c] border border-color-border text-white py-2.5 rounded-xl hover:bg-white/5 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  disconnect();
                  localStorage.removeItem("walletToken");
                  setShowDisconnectModal(false);
                  toast.success("Logged out successfully");
                }}
                className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 py-2.5 rounded-xl transition-colors font-semibold"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
