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
        <div className="animate-spin text-4xl mb-4 text-color-muted">⟳</div>
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
            <svg className="w-6 h-6 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></svg>
          </h1>
          <div className="flex items-center gap-2 mt-1 mb-3">
            <p className="text-color-muted text-sm truncate max-w-[200px] md:max-w-xs font-mono">{id}</p>
            <a 
              href={`https://solscan.io/account/${id}?cluster=devnet`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-1 bg-[#161A22] text-color-muted hover:text-white border border-color-border px-2 py-0.5 rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              Solscan
            </a>
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
          <TradingWidget marketPda={id} />

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
