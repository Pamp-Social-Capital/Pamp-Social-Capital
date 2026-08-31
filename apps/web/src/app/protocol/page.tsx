"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { TopNav } from "../../components/TopNav";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProtocolDashboard() {
  const { data, error, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/api/protocol/stats`, fetcher);

  const stats = data?.stats || {
    totalProtocolFeesLamports: 0,
    totalBuybackSolSpentLamports: 0,
    totalPscBought: 0,
    totalPscBurned: 0,
  };

  const feesSol = (Number(stats.totalProtocolFeesLamports) / 1e9).toFixed(4);
  const buybackSol = (Number(stats.totalBuybackSolSpentLamports) / 1e9).toFixed(4);
  const pscBought = (Number(stats.totalPscBought) / 1e6).toFixed(2); // Assuming 6 decimals for PSC
  const pscBurned = (Number(stats.totalPscBurned) / 1e6).toFixed(2);

  return (
    <div className="min-h-screen bg-color-background text-color-foreground flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 border-b border-color-border pb-6 mt-4">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-color-buy rounded-xl flex items-center justify-center text-[#0B0E14]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            Protocol Dashboard
          </h1>
          <p className="text-color-muted mt-2">Transparent tracking of protocol fees, automated buybacks, and $PSC burns.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <svg className="w-10 h-10 animate-spin text-color-buy" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-2xl text-center">
            Failed to load protocol stats.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-color-card border border-color-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
              <p className="text-color-muted text-sm font-semibold mb-2 uppercase tracking-wide">Total Protocol Fees</p>
              <p className="text-3xl font-black text-white">{feesSol} <span className="text-xl text-color-muted font-bold">SOL</span></p>
              <div className="mt-4 pt-4 border-t border-color-border/50 flex items-center justify-between text-xs text-color-muted">
                <span>Collected from 5% fee split</span>
                <span className="text-blue-400 font-semibold bg-blue-400/10 px-2 py-0.5 rounded">All-Time</span>
              </div>
            </div>

            <div className="bg-color-card border border-color-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-color-buy/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
              <p className="text-color-muted text-sm font-semibold mb-2 uppercase tracking-wide">Total SOL Deployed</p>
              <p className="text-3xl font-black text-white">{buybackSol} <span className="text-xl text-color-muted font-bold">SOL</span></p>
              <div className="mt-4 pt-4 border-t border-color-border/50 flex items-center justify-between text-xs text-color-muted">
                <span>Spent on $PSC buybacks</span>
                <span className="text-color-buy font-semibold bg-color-buy/10 px-2 py-0.5 rounded">Vault</span>
              </div>
            </div>

            <div className="bg-color-card border border-color-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
              <p className="text-color-muted text-sm font-semibold mb-2 uppercase tracking-wide">$PSC Acquired</p>
              <p className="text-3xl font-black text-white">{pscBought} <span className="text-xl text-color-muted font-bold">$PSC</span></p>
              <div className="mt-4 pt-4 border-t border-color-border/50 flex items-center justify-between text-xs text-color-muted">
                <span>Purchased from market</span>
                <span className="text-purple-400 font-semibold bg-purple-400/10 px-2 py-0.5 rounded">Gross</span>
              </div>
            </div>

            <div className="bg-color-card border border-color-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-color-sell/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
              <p className="text-color-muted text-sm font-semibold mb-2 uppercase tracking-wide">$PSC Burned</p>
              <p className="text-3xl font-black text-white">{pscBurned} <span className="text-xl text-color-muted font-bold">$PSC</span></p>
              <div className="mt-4 pt-4 border-t border-color-border/50 flex items-center justify-between text-xs text-color-muted">
                <span>Permanently removed from supply</span>
                <span className="text-color-sell font-semibold bg-color-sell/10 px-2 py-0.5 rounded">Deflationary</span>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
