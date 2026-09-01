"use client";

import React, { useEffect, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";

interface UserTrade {
  signature: string;
  marketPda: string;
  traderWallet: string;
  tradeType: string;
  amount: number;
  lamports: string;
  feeLamports: string;
  timestamp: string;
}

export const UserTradeHistoryComponent = ({ address }: { address?: string }) => {
  const { publicKey } = useWallet();
  const targetAddress = address || publicKey?.toBase58();
  const [trades, setTrades] = useState<UserTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!targetAddress) {
      setLoading(false);
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
    
    // Fetch user trades
    fetch(`${API_URL}/api/portfolio/${targetAddress}/trades`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.trades) {
          setTrades(data.trades);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch trades:", err);
        setError(true);
        setLoading(false);
      });
  }, [targetAddress]);

  if (!targetAddress) return null;

  if (loading) {
    return (
      <div className="overflow-x-auto mt-12 bg-color-card rounded-xl border border-color-border p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Trade History</h2>
        <div className="overflow-x-auto animate-pulse mt-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-color-muted border-b border-color-border">
                <th className="pb-4"><div className="h-4 w-12 bg-white/5 rounded"></div></th>
                <th className="pb-4"><div className="h-4 w-16 bg-white/5 rounded"></div></th>
                <th className="pb-4"><div className="h-4 w-24 bg-white/5 rounded"></div></th>
                <th className="pb-4"><div className="h-4 w-20 bg-white/5 rounded"></div></th>
                <th className="pb-4"><div className="h-4 w-20 bg-white/5 rounded"></div></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-[#1A1F2B]">
                  <td className="py-4"><div className="h-4 w-12 bg-white/5 rounded"></div></td>
                  <td className="py-4"><div className="h-4 w-10 bg-white/5 rounded"></div></td>
                  <td className="py-4"><div className="h-4 w-20 bg-white/5 rounded"></div></td>
                  <td className="py-4"><div className="h-4 w-16 bg-white/5 rounded"></div></td>
                  <td className="py-4"><div className="h-4 w-16 bg-white/5 rounded"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-x-auto mt-12 bg-color-card rounded-xl border border-color-border p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Trade History</h2>
        <div className="text-center py-12 text-color-sell">Error loading trade history</div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="overflow-x-auto mt-12 bg-color-card rounded-xl border border-color-border p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Trade History</h2>
        <div className="text-center py-12 text-color-muted">No trade history found.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-12 bg-color-card rounded-xl border border-color-border p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-6">Trade History</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-color-border text-color-muted text-sm uppercase">
            <th className="py-3 font-semibold">Type</th>
            <th className="py-3 font-semibold">Keys</th>
            <th className="py-3 font-semibold">Amount (SOL)</th>
            <th className="py-3 font-semibold">Market PDA</th>
            <th className="py-3 font-semibold">Time</th>
            <th className="py-3 font-semibold">Transaction</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {trades.map((trade: any) => {
            const isBuy = trade.tradeType === "buy";
            const amountSol = (Number(trade.lamports) / 1e9).toFixed(4);
            const timeAgo = new Date(trade.timestamp).toLocaleTimeString();
            const shortMarket = `${trade.marketPda.slice(0, 4)}...${trade.marketPda.slice(-4)}`;
            const marketName = trade.marketDetails?.twitterHandle || "Unknown Creator";

            return (
              <tr key={trade.signature} className="border-b border-[#1A1F2B] hover:bg-[#161A22] transition-colors">
                <td className={`py-3 font-medium ${isBuy ? 'text-color-buy' : 'text-color-sell'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </td>
                <td className="py-3 text-white">{trade.amount}</td>
                <td className="py-3 text-white">{amountSol}</td>
                <td className="py-3 font-semibold hover:underline">
                  <a href={`/creator/${trade.marketPda}`} className="flex flex-col">
                    <span className="text-white text-base">{trade.marketDetails?.twitterHandle || "Unknown Creator"}</span>
                    <span className="text-color-buy text-xs font-normal mt-0.5">{shortMarket}</span>
                  </a>
                </td>
                <td className="py-3 text-color-muted whitespace-nowrap">
                  {timeAgo}
                </td>
                <td className="py-3 text-color-muted">
                  <a href={`https://solscan.io/tx/${trade.signature}${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    {trade.signature.slice(0, 4)}...{trade.signature.slice(-4)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
