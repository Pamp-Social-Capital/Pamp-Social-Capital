"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";

interface PageProps {
  params: Promise<{ address: string }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage({ params }: PageProps) {
  const { address } = use(params);
  const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  
  const { data, error, isLoading } = useSWR(
    `${API_URL}/api/users/${address}/markets?network=${network}`, 
    fetcher
  );

  const markets = data?.markets || [];
  const success = data?.success;
  const userProfile = data?.userProfile;
  const stats = data?.stats || { totalFeesWithdrawn: 0 };
  const withdrawals = data?.withdrawals || [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col items-center gap-4 bg-color-card p-8 rounded-2xl border border-color-border shadow-lg">
          <div className="w-24 h-24 rounded-full bg-white/5"></div>
          <div className="h-6 w-48 bg-white/5 rounded"></div>
          <div className="h-4 w-32 bg-white/5 rounded"></div>
        </div>
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-color-card rounded-2xl border border-color-border"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || (data && !success)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold text-red-400 mb-2">Error Loading Profile</h1>
        <p className="text-color-muted">Failed to fetch creator history.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-indigo-900/40 to-color-card p-10 rounded-2xl border border-color-border shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />
        
        <div className="w-28 h-28 rounded-full overflow-hidden bg-[#161A22] border-4 border-indigo-500/30 shadow-xl">
          <img 
            src={userProfile?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} 
            alt="Creator Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            {userProfile?.username || `${address.slice(0, 4)}...${address.slice(-4)}`}
            <button
              onClick={() => navigator.clipboard.writeText(address)}
              title="Copy Address"
              className="p-1.5 bg-[#161A22] border border-color-border rounded-lg text-color-muted hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
          </h1>
          <p className="text-indigo-300 font-medium">Creator Profile</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
          <div className="bg-[#161A22] border border-color-border px-6 py-3 rounded-xl min-w-[150px]">
            <div className="text-color-muted text-sm mb-1">Total Launched</div>
            <div className="text-2xl font-bold text-white">{markets.length} <span className="text-sm font-normal text-color-muted">Markets</span></div>
          </div>
          <div className="bg-[#161A22] border border-color-border px-6 py-3 rounded-xl min-w-[150px]">
            <div className="text-color-muted text-sm mb-1">Total Profit (Withdrawn)</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.totalFeesWithdrawn.toFixed(4)} <span className="text-sm font-normal text-color-muted">SOL</span></div>
          </div>
        </div>
      </div>

      {/* Withdrawals & Markets Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Withdrawal History (Sidebar on Desktop) */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Withdrawal History
          </h2>
          
          {withdrawals.length === 0 ? (
            <div className="bg-color-card border border-color-border rounded-2xl p-6 text-center">
              <p className="text-color-muted text-sm">No withdrawals yet.</p>
            </div>
          ) : (
            <div className="bg-color-card border border-color-border rounded-2xl overflow-hidden shadow-lg">
              <div className="divide-y divide-color-border">
                {withdrawals.map((w: any) => (
                  <div key={w.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <div className="font-bold text-emerald-400">
                        +{(w.amount / 1e9).toFixed(4)} SOL
                      </div>
                      <div className="text-xs text-color-muted mt-1">
                        {new Date(w.timestamp).toLocaleDateString()} {new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <a 
                      href={`https://explorer.solana.com/tx/${w.signature}?cluster=${network}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-[#161A22] rounded-lg border border-color-border text-color-muted hover:text-white transition-colors"
                      title="View on Explorer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Market History Grid */}
        <div className="lg:col-span-2">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          Market History
        </h2>
        
        {markets.length === 0 ? (
          <div className="bg-color-card border border-color-border rounded-2xl p-10 text-center">
            <p className="text-color-muted">This address has not launched any markets yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {markets.map((market: any) => (
              <div key={market.marketPda} className="bg-color-card border border-color-border rounded-2xl overflow-hidden shadow-lg hover:border-indigo-500/50 transition-colors group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#161A22] border border-color-border overflow-hidden shrink-0">
                        {market.avatarUrl ? (
                          <img src={market.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold bg-indigo-600">
                            {market.twitterHandle.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white truncate max-w-[150px]">@{market.twitterHandle}</h3>
                        <p className="text-sm text-color-muted truncate max-w-[150px]">{market.ticker || market.twitterHandle}</p>
                      </div>
                    </div>
                    
                    {market.claimed ? (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        Claimed
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                        Unclaimed
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-color-muted">Market PDA</span>
                      <span className="text-white font-mono">{market.marketPda.slice(0,4)}...{market.marketPda.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-color-muted">Date</span>
                      <span className="text-white">{new Date(market.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/creator/${market.marketPda}`}
                    className="block w-full text-center bg-[#161A22] hover:bg-indigo-600 border border-color-border hover:border-indigo-500 text-white font-medium py-2 rounded-xl transition-all"
                  >
                    View Market
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
