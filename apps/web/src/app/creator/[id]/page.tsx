"use client";

import { TradingWidget } from "@/components/TradingWidget";
import { ChartComponent } from "@/components/ChartComponent";
import { TradeHistoryComponent } from "@/components/TradeHistoryComponent";
import { CreatorDashboard } from "@/components/CreatorDashboard";
import { use, useState, useEffect } from "react";
import useSWR from "swr";
import { useSocialCapital } from "../../../hooks/useSocialCapital";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CreatorPage({ params }: PageProps) {
  const { id } = use(params);
  
  const getAvatarStyle = (seed: string) => {
    const styles = ["adventurer", "big-ears", "bottts", "bottts-neutral", "critters", "pixel-art", "voxel-art", "voxel-bot"];
    let hash = 0;
    for (let i = 0; i < Math.min(seed.length, 5); i++) hash += seed.charCodeAt(i);
    return styles[hash % styles.length];
  };

  const sdk = useSocialCapital();
  const [onChainMarket, setOnChainMarket] = useState<any>(null);
  const [isChainLoading, setIsChainLoading] = useState(true);
  const [chartResolution, setChartResolution] = useState("5m");
  
  // Fetch from database API
  const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
  const { data, error, isLoading } = useSWR(
    `${API_URL}/api/markets`, 
    fetcher
  );

  const dbMarket = data?.markets?.find((m: any) => m.marketPda === id);

  // Fetch directly from blockchain (crucial for local devnet where webhooks might not fire)
  useEffect(() => {
    if (sdk && id) {
      try {
        const pda = new PublicKey(id);
        sdk.program.account.creatorMarket.fetch(pda)
          .then((account: any) => {
            setOnChainMarket(account);
          })
          .catch((err: any) => {
            console.error("Failed to fetch onchain market:", err);
          })
          .finally(() => {
            setIsChainLoading(false);
          });
      } catch (e) {
        setIsChainLoading(false);
      }
    }
  }, [sdk, id]);

  const isLoadingTotal = isLoading && isChainLoading;
  
  // Use DB market, or construct from on-chain data if DB sync failed
  const finalMarket = dbMarket || (onChainMarket ? {
    supply: onChainMarket.supply.toNumber(),
    reserveLamports: onChainMarket.reserveLamports.toNumber(),
    claimed: onChainMarket.claimed,
    twitterHandle: new TextDecoder().decode(Uint8Array.from(onChainMarket.creatorId).filter(b => b !== 0))
  } : null);

  if (isLoadingTotal) {
    return (
      <div className="flex flex-col gap-6 pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-6 bg-[#12141A] p-6 rounded-2xl border border-color-border/50 shadow-lg">
          <div className="w-24 h-24 rounded-full bg-white/5"></div>
          <div className="flex-1">
            <div className="h-8 w-48 bg-white/5 rounded mb-3"></div>
            <div className="h-4 w-32 bg-white/5 rounded mb-4"></div>
            <div className="flex gap-4">
              <div className="h-8 w-32 bg-white/5 rounded-full"></div>
              <div className="h-8 w-32 bg-white/5 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="h-[500px] bg-[#12141A] rounded-2xl border border-color-border/50"></div>
            <div className="h-[300px] bg-[#12141A] rounded-2xl border border-color-border/50"></div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="h-[400px] bg-[#12141A] rounded-2xl border border-color-border/50"></div>
            <div className="h-[200px] bg-[#12141A] rounded-2xl border border-color-border/50"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!finalMarket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold text-white mb-2">Market Not Found</h1>
        <p className="text-color-muted">This market does not exist or hasn't synced yet.</p>
      </div>
    );
  }

  const calculateNextKeyPrice = (currentSupply: number) => {
    const K_CONSTANT = 100_000;
    const s1 = BigInt(currentSupply);
    const s2 = BigInt(currentSupply + 1);
    const cost = (BigInt(K_CONSTANT) * ((s2 ** BigInt(3)) - (s1 ** BigInt(3)))) / BigInt(3);
    return Number(cost) / 1e9;
  };

  const supply = finalMarket.supply || 0;
  const reserve = (Number(finalMarket.reserveLamports || 0) / 1e9).toFixed(2);
  const spotPrice = calculateNextKeyPrice(supply);
  const mcap = (supply * spotPrice).toFixed(4); 
  const price = spotPrice.toFixed(6); 
  const creatorName = finalMarket.twitterName || finalMarket.twitterHandle || "Unknown";
  const handleUrl = finalMarket.twitterHandle || creatorName;
  
  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Creator Dashboard (Only shows if connected wallet == creatorWallet, or unclaimed market owner) */}
      {finalMarket && <CreatorDashboard marketPda={id as string} creatorWallet={onChainMarket?.creatorWallet?.toBase58() || ""} claimed={!!finalMarket.claimed} twitterHandle={finalMarket.twitterHandle || ""} />}
      
      {/* Header Profile */}
      <div className="flex items-center gap-6 bg-[#12141A] p-6 rounded-2xl border border-color-border/50 shadow-lg">
        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-inner overflow-hidden">
          {finalMarket.avatarUrl ? (
            <img src={finalMarket.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            creatorName.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            {finalMarket.ticker || creatorName}
            
            <div className="flex items-center gap-2">
              <a 
                href={`https://x.com/${handleUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300 transition-colors"
                title={`View @${handleUrl} on X`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
              </a>
              {finalMarket.websiteUrl && (
                <a href={finalMarket.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-color-muted hover:text-white transition-colors" title="Website">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                </a>
              )}
              {finalMarket.telegramUrl && (
                <a href={finalMarket.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-[#0088cc] hover:text-blue-400 transition-colors" title="Telegram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.62-.2-1.12-.31-1.09-.66.02-.18.27-.36.77-.55 3.02-1.31 5.03-2.18 6.04-2.6.28-.11 3.23-1.33 3.86-1.33.14 0 .45.03.62.17.14.12.18.28.19.4z"></path></svg>
                </a>
              )}
            </div>
          </h1>
          <div className="text-color-muted text-lg mt-1 mb-2">@{handleUrl}</div>
          <div className="flex items-center gap-2 mt-1 mb-2">
            <p className="text-color-muted text-sm truncate max-w-[200px] md:max-w-xs font-mono">{id}</p>
            <a 
              href={`https://solscan.io/account/${id}${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`} 
              target="_blank" 
              rel="noopener noreferrer"
              title="View on Solscan"
              className="p-1 bg-[#161A22] text-color-muted hover:text-white border border-color-border/50 rounded transition-colors flex items-center justify-center"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(id as string)}
              title="Copy Address"
              className="p-1 bg-[#161A22] text-color-muted hover:text-white border border-color-border/50 rounded transition-colors flex items-center justify-center"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
          </div>
          
          {finalMarket.description && (
            <p className="text-color-muted text-sm mt-3 max-w-2xl italic leading-relaxed">
              "{finalMarket.description}"
            </p>
          )}
          <div className="flex items-center gap-4 text-sm font-medium mt-4">
            <span className="bg-[#161A22] border border-color-border/50 px-3 py-1 rounded-full text-white">
              <span className="text-color-muted mr-1">Keys:</span> {supply.toLocaleString()}
            </span>
            <span className={`border px-3 py-1 rounded-full ${finalMarket.claimed ? 'bg-color-buy/10 border-color-buy/30 text-color-buy' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <span className="text-color-muted mr-1">Status:</span> {finalMarket.claimed ? "Claimed" : "Unclaimed"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Main Chart */}
          <section className="bg-[#12141A] border border-color-border/50 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Price History</h2>
                <div className="text-color-buy text-sm mt-1">{price} SOL</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setChartResolution("1m")}
                  className={chartResolution === "1m" ? "text-white font-medium bg-[#232832] rounded text-sm px-2 py-1" : "text-color-muted hover:text-white text-sm px-2"}
                >1M</button>
                <button 
                  onClick={() => setChartResolution("5m")}
                  className={chartResolution === "5m" ? "text-white font-medium bg-[#232832] rounded text-sm px-2 py-1" : "text-color-muted hover:text-white text-sm px-2"}
                >5M</button>
                <button 
                  onClick={() => setChartResolution("15m")}
                  className={chartResolution === "15m" ? "text-white font-medium bg-[#232832] rounded text-sm px-2 py-1" : "text-color-muted hover:text-white text-sm px-2"}
                >15M</button>
                <button 
                  onClick={() => setChartResolution("1h")}
                  className={chartResolution === "1h" ? "text-white font-medium bg-[#232832] rounded text-sm px-2 py-1" : "text-color-muted hover:text-white text-sm px-2"}
                >1H</button>
                <button 
                  onClick={() => setChartResolution("1d")}
                  className={chartResolution === "1d" ? "text-white font-medium bg-[#232832] rounded text-sm px-2 py-1" : "text-color-muted hover:text-white text-sm px-2"}
                >1D</button>
              </div>
            </div>
            <div className="w-full bg-[#07090c] border border-color-border/50 rounded-xl h-[400px] overflow-hidden">
              <ChartComponent marketPda={id} resolution={chartResolution} />
            </div>
          </section>

          {/* Trade History */}
          <section className="bg-[#12141A] border border-color-border/50 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Recent Trades</h2>
            <TradeHistoryComponent marketPda={id} />
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          <TradingWidget marketPda={id} twitterHandle={finalMarket.twitterHandle} />

          {/* Creator Profile Card */}
          {onChainMarket?.creatorWallet && (
            <div className="bg-[#12141A] border border-color-border/50 p-6 rounded-2xl shadow-lg hover:border-indigo-500/50 transition-colors group">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                Creator Profile
                {finalMarket.claimed ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Unclaimed
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#161A22] border-2 border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors shrink-0">
                  <img 
                    src={finalMarket.avatarUrl || `https://api.dicebear.com/10.x/${getAvatarStyle(onChainMarket.creatorWallet.toBase58())}/svg?seed=${onChainMarket.creatorWallet.toBase58()}`} 
                    alt="Creator Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">@{handleUrl}</p>
                  <p className="text-color-muted text-sm font-mono truncate mb-2 text-indigo-300">
                    {onChainMarket.creatorWallet.toBase58().slice(0, 4)}...{onChainMarket.creatorWallet.toBase58().slice(-4)}
                  </p>
                  <Link 
                    href={`/profile/${onChainMarket.creatorWallet.toBase58()}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View History
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Market Stats */}
          <div className="bg-[#12141A] rounded-2xl p-6 border border-color-border/50 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">Market Stats</h2>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between border-b border-color-border/50 pb-3">
                <span className="text-color-muted">Market Cap</span>
                <span className="font-semibold text-white">{mcap} SOL</span>
              </div>
              <div className="flex justify-between border-b border-color-border/50 pb-3">
                <span className="text-color-muted">Total Reserve</span>
                <span className="font-semibold text-white">{reserve} SOL</span>
              </div>
              <div className="flex justify-between border-b border-color-border/50 pb-3">
                <span className="text-color-muted">Creator Fee</span>
                <span className="font-semibold text-white">0.30%</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-color-muted">Protocol Fee</span>
                <span className="font-semibold text-white">0.95%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
