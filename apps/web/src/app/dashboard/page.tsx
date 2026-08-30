"use client";

import { MarketCard, Market } from "@/components/MarketCard";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/markets`, 
    fetcher
  );

  const calculateNextKeyPriceLamports = (currentSupply: number) => {
    const K_CONSTANT = 100_000;
    const s1 = BigInt(currentSupply || 0);
    const s2 = BigInt((currentSupply || 0) + 1);
    const cost = (BigInt(K_CONSTANT) * ((s2 ** BigInt(3)) - (s1 ** BigInt(3)))) / BigInt(3);
    return cost.toString();
  };

  // Map API response to the Market interface expected by MarketCard
  const markets: Market[] = data?.markets?.map((m: any) => {
    const currentPriceLamports = m.currentPriceLamports || calculateNextKeyPriceLamports(m.supply);
    return {
      id: m.id,
      marketPda: m.marketPda,
      twitterHandle: m.twitterHandle,
      supply: m.supply,
      reserveLamports: m.reserveLamports,
      totalVolumeLamports: m.totalVolumeLamports,
      // Provide default/calculated fields for properties not yet in the DB schema
      currentPriceLamports, 
      marketCapLamports: m.marketCapLamports || (BigInt(m.supply || 0) * BigInt(currentPriceLamports)).toString(),
      holderCount: m.holderCount || 0,
      creatorFeeBps: m.creatorFeeBps || 30, // 30 bps = 0.3%
      username: m.twitterHandle || "Unknown",
      avatarUrl: m.avatarUrl,
    };
  }) || [];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero Section */}
      <section className="mt-6">
        <div className="w-full bg-gradient-to-r from-[#0f1d17] to-[#161A22] rounded-2xl border border-color-border p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-color-buy opacity-10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="z-10">
            <h1 className="text-3xl font-bold text-white mb-2">Social Capital Hub</h1>
            <p className="text-color-muted max-w-xl text-sm mb-8">
              Discover top creators, trade keys on the bonding curve, and build your portfolio in one seamless hub.
            </p>
            
            {(() => {
              const totalMarkets = data?.markets?.length || 0;
              const totalTvl = (data?.markets?.reduce((acc: number, m: any) => acc + Number(m.reserveLamports), 0) / 1e9 || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const totalVol = (data?.markets?.reduce((acc: number, m: any) => acc + Number(m.totalVolumeLamports), 0) / 1e9 || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div className="flex gap-12">
                  <div>
                    <p className="text-color-muted text-xs mb-1">Total TVL</p>
                    <p className="text-2xl font-bold text-white">{totalTvl} <span className="text-sm font-normal text-color-muted">SOL</span></p>
                  </div>
                  <div>
                    <p className="text-color-muted text-xs mb-1">Total Volume</p>
                    <p className="text-2xl font-bold text-white">{totalVol} <span className="text-sm font-normal text-color-muted">SOL</span></p>
                  </div>
                  <div>
                    <p className="text-color-muted text-xs mb-1">Live Markets</p>
                    <p className="text-2xl font-bold text-white">{totalMarkets}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-8 lg:mt-0 z-10 flex flex-col sm:flex-row gap-4">
            <button className="bg-white text-[#0B0E14] font-semibold px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors">
              Explore Markets
            </button>
            <Link href="/claim" className="glass-panel text-white font-semibold px-6 py-2.5 rounded-full hover:bg-white/10 transition-colors text-center">
              Create Market
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs and Filters */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-color-border pb-4 mt-4">
        <div className="flex gap-6 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button className="text-white font-semibold whitespace-nowrap bg-[#232832] px-4 py-1.5 rounded-lg">Overall Ranking</button>
          <button className="text-color-muted hover:text-white font-medium whitespace-nowrap transition-colors px-2 py-1.5">Highest Volume</button>
          <button className="text-color-muted hover:text-white font-medium whitespace-nowrap transition-colors px-2 py-1.5">Newest</button>
          <button className="text-color-muted hover:text-white font-medium whitespace-nowrap transition-colors px-2 py-1.5">Most Holders</button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="glass-panel text-white px-4 py-1.5 rounded-lg flex items-center text-sm font-medium hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filter
          </button>
          <div className="flex items-center bg-[#161A22] border border-color-border rounded-lg px-3 py-1.5 w-full md:w-48">
            <svg className="w-4 h-4 text-color-muted mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm text-white placeholder-color-muted w-full" />
          </div>
        </div>
      </section>

      {/* Markets Grid */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-color-card rounded-xl p-5 border border-color-border flex flex-col justify-between h-[200px] animate-pulse">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5"></div>
                    <div>
                      <div className="h-4 w-24 bg-white/5 rounded mb-2"></div>
                      <div className="h-3 w-16 bg-white/5 rounded"></div>
                    </div>
                  </div>
                  <div className="w-20 h-7 bg-white/5 rounded-full"></div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="h-3 w-16 bg-white/5 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-white/5 rounded mb-2"></div>
                    <div className="h-3 w-20 bg-white/5 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 text-color-sell">
            Error loading markets. Please ensure the backend is running.
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-24 text-color-muted border border-dashed border-color-border rounded-2xl mt-2">
            No live markets found on-chain. <br /> Be the first to create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
            {markets.map((market: Market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
