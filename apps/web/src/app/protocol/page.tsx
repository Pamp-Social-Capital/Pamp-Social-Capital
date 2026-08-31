"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import bs58 from "bs58"; // or similar logic for signatures if needed

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProtocolDashboard() {
  const { data: statsData, isLoading: isStatsLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/api/protocol/stats`, fetcher);
  const { data: logsData, isLoading: isLogsLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_URL}/api/protocol/logs`, fetcher);

  const isLoading = isStatsLoading || isLogsLoading;

  const stats = statsData?.stats || {
    totalProtocolFeesLamports: 0,
    totalBuybackSolSpentLamports: 0,
    totalPscBought: 0,
    totalPscBurned: 0,
  };

  const feesSol = (Number(stats.totalProtocolFeesLamports) / 1e9).toFixed(6);
  const buybackSol = (Number(stats.totalBuybackSolSpentLamports) / 1e9).toFixed(6);
  const pscBought = (Number(stats.totalPscBought) / 1e6).toFixed(2); // Assuming 6 decimals for PSC
  const pscBurned = (Number(stats.totalPscBurned) / 1e6).toFixed(2);

  const keeperLogs = logsData?.keeperLogs || [];
  const recentFees = logsData?.recentFees || [];

  return (
    <div className="min-h-screen bg-color-background text-color-foreground flex flex-col">
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
        ) : (
          <div className="flex flex-col gap-10">
            {/* KPI Cards */}
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

            {/* Logs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Fee Inflows */}
              <div className="bg-color-card border border-color-border rounded-2xl p-6 shadow-xl flex flex-col h-[500px]">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-color-border/50 pb-2 flex justify-between items-center">
                  Protocol Fee Inflows
                  <span className="text-xs font-normal text-color-muted bg-[#161A22] px-2 py-1 rounded">Live from On-Chain</span>
                </h2>
                <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                  {recentFees.length === 0 ? (
                    <p className="text-color-muted text-center py-10">No fee inflows yet.</p>
                  ) : (
                    recentFees.map((fee: any) => (
                      <div key={fee.id} className="bg-[#161A22] border border-color-border rounded-xl p-3 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-white font-mono text-sm">+{(Number(fee.amount) / 1e9).toFixed(6)} SOL</span>
                          <a href={`https://solscan.io/tx/${fee.signature}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs mt-1">
                            {fee.signature.substring(0, 4)}...{fee.signature.substring(fee.signature.length - 4)}
                          </a>
                        </div>
                        <span className="text-color-muted text-xs">
                          {new Date(fee.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Keeper Logs */}
              <div className="bg-color-card border border-color-border rounded-2xl p-6 shadow-xl flex flex-col h-[500px]">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-color-border/50 pb-2 flex justify-between items-center">
                  Keeper Execution Logs
                  <span className="text-xs font-normal text-color-muted bg-[#161A22] px-2 py-1 rounded">Every 6 Hours</span>
                </h2>
                <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                  {keeperLogs.length === 0 ? (
                    <p className="text-color-muted text-center py-10">No keeper executions yet.</p>
                  ) : (
                    keeperLogs.map((log: any) => {
                      const details = JSON.parse(log.details || "{}");
                      const isSuccess = log.status === "SUCCESS";
                      const isSkipped = log.status === "SKIPPED";
                      return (
                        <div key={log.id} className={`bg-[#161A22] border rounded-xl p-3 flex flex-col gap-2 ${isSuccess ? 'border-color-buy/30' : isSkipped ? 'border-color-border' : 'border-color-sell/30'}`}>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSuccess ? 'bg-color-buy/20 text-color-buy' : isSkipped ? 'bg-color-muted/20 text-color-muted' : 'bg-color-sell/20 text-color-sell'}`}>
                              {log.status}
                            </span>
                            <span className="text-color-muted text-xs">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-color-muted font-mono bg-[#0B0E14] p-2 rounded-lg break-words">
                            {isSkipped && details.reason && `Reason: ${details.reason} (Vault: ${(details.vaultBalance / 1e9).toFixed(4)} SOL)`}
                            {isSuccess && `Spent: ${(details.solSpent / 1e9).toFixed(4)} SOL | Burned: ${(details.pscReceived / 1e6).toFixed(2)} PSC`}
                            {!isSkipped && !isSuccess && (log.errorMessage || "Unknown Error")}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
