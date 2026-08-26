"use client";

import { TradingWidget } from "@/components/TradingWidget";
import { ChartComponent } from "@/components/ChartComponent";
import { use, useState, useEffect } from "react";
import useSWR from "swr";

interface PageProps {
  params: Promise<{ id: string }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CreatorPage({ params }: PageProps) {
  // Use React 19's `use` to unwrap the params promise
  const { id } = use(params);
  
  // Note: Since we don't have a /api/markets/:id route yet, we can temporarily fetch all and filter 
  // or fetch just this one if we add a route. For now, we'll fetch all and filter.
  // In a real production app, we would have a specific endpoint.
  const { data, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/markets`, 
    fetcher
  );

  const market = data?.markets?.find((m: any) => m.marketPda === id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex justify-center mb-4"><svg className="animate-spin h-10 w-10 text-color-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
        <p className="text-color-muted">Loading market details...</p>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold text-white mb-2">Market Not Found</h1>
        <p className="text-color-muted">This market does not exist or hasn't synced yet.</p>
      </div>
    );
  }

  const supply = market.supply || 0;
  const reserve = (Number(market.reserveLamports || 0) / 1e9).toFixed(2);
  const mcap = (supply * 0.0062).toFixed(2); // Simplified spot math
  const price = "0.0062"; // Simplified spot price
  const creatorName = market.twitterHandle || "Unknown";
  
  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header Profile */}
      <div className="flex items-center gap-6 bg-color-card p-6 rounded-2xl border border-color-border shadow-lg">
        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
          {creatorName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            {creatorName}
            <a 
              href={`https://x.com/${creatorName}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors"
              title={`View @${creatorName} on X`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
            </a>
          </h1>
          <div className="flex items-center gap-2 mt-1 mb-3">
            <p className="text-color-muted text-sm truncate max-w-[200px] md:max-w-xs font-mono">{id}</p>
            <a 
              href={`https://solscan.io/account/${id}?cluster=devnet`} 
              target="_blank" 
              rel="noopener noreferrer"
              title="View on Solscan"
              className="p-1 bg-[#161A22] text-color-muted hover:text-white border border-color-border rounded transition-colors flex items-center justify-center"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(id as string)}
              title="Copy Address"
              className="p-1 bg-[#161A22] text-color-muted hover:text-white border border-color-border rounded transition-colors flex items-center justify-center"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="bg-[#161A22] border border-color-border px-3 py-1 rounded-full text-white">
              <span className="text-color-muted mr-1">Keys:</span> {supply.toLocaleString()}
            </span>
            <span className="bg-[#161A22] border border-color-border px-3 py-1 rounded-full text-white">
              <span className="text-color-muted mr-1">Status:</span> {market.claimed ? "Claimed" : "Active"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Main Chart */}
          <section className="bg-color-card border border-color-border p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Price History</h2>
                <div className="text-color-buy text-sm mt-1">{price} SOL</div>
              </div>
              <div className="flex gap-2">
                <button className="text-color-muted hover:text-white text-sm px-2">1H</button>
                <button className="text-white font-medium bg-[#232832] rounded text-sm px-2 py-1">1D</button>
                <button className="text-color-muted hover:text-white text-sm px-2">1W</button>
              </div>
            </div>
            <div className="w-full bg-[#0B0E14] border border-color-border rounded-xl h-[400px] overflow-hidden">
              <ChartComponent marketPda={id} />
            </div>
          </section>

          {/* Trade History */}
          <section className="bg-color-card border border-color-border p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Recent Trades</h2>
            <div className="overflow-x-auto text-center py-8 text-color-muted">
              Live trade history sync is being implemented via Helius webhook...
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          <TradingWidget marketPda={id} twitterHandle={market.twitterHandle} />

          {/* Market Stats */}
          <div className="bg-color-card rounded-2xl p-6 border border-color-border shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">Market Stats</h2>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between border-b border-color-border pb-3">
                <span className="text-color-muted">Market Cap</span>
                <span className="font-semibold text-white">{mcap} SOL</span>
              </div>
              <div className="flex justify-between border-b border-color-border pb-3">
                <span className="text-color-muted">Total Reserve</span>
                <span className="font-semibold text-white">{reserve} SOL</span>
              </div>
              <div className="flex justify-between border-b border-color-border pb-3">
                <span className="text-color-muted">Creator Fee</span>
                <span className="font-semibold text-white">5.0%</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-color-muted">Protocol Fee</span>
                <span className="font-semibold text-white">2.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
