"use client";

import React, { useEffect, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import Link from 'next/link';

interface UserWithdrawal {
  id: string;
  signature: string;
  marketPda: string;
  creatorWallet: string;
  amount: number;
  timestamp: string;
  marketDetails?: {
    twitterHandle: string;
  };
}

export const UserWithdrawalHistoryComponent = () => {
  const { publicKey } = useWallet();
  const [withdrawals, setWithdrawals] = useState<UserWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
    
    // Fetch user withdrawals
    fetch(`${API_URL}/api/portfolio/${publicKey.toBase58()}/withdrawals`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.withdrawals) {
          setWithdrawals(data.withdrawals);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load user withdrawals:", err);
        setError(true);
        setLoading(false);
      });
  }, [publicKey]);

  if (!publicKey) return null;

  if (loading) {
    return (
      <div className="overflow-x-auto mt-12 bg-color-card rounded-xl border border-color-border p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Withdrawal History</h2>
        <div className="overflow-x-auto animate-pulse mt-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-color-muted border-b border-color-border">
                <th className="pb-4"><div className="h-4 w-12 bg-white/5 rounded"></div></th>
                <th className="pb-4"><div className="h-4 w-16 bg-white/5 rounded"></div></th>
                <th className="pb-4"><div className="h-4 w-24 bg-white/5 rounded"></div></th>
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
        <h2 className="text-xl font-bold text-white mb-6">Withdrawal History</h2>
        <div className="text-center py-12 text-color-sell">Error loading withdrawal history</div>
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="overflow-x-auto mt-12 bg-color-card rounded-xl border border-color-border p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Withdrawal History</h2>
        <div className="text-center py-12 text-color-muted">No withdrawal history found.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-12 bg-color-card rounded-xl border border-color-border p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-6">Withdrawal History</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-color-border text-color-muted text-sm uppercase">
            <th className="py-3 font-semibold">Time</th>
            <th className="py-3 font-semibold">Amount (SOL)</th>
            <th className="py-3 font-semibold">Market PDA</th>
            <th className="py-3 font-semibold">Transaction</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {withdrawals.map((w: any) => {
            const amountSol = (Number(w.amount) / 1e9).toFixed(4);
            const timeAgo = new Date(w.timestamp).toLocaleTimeString();
            const shortMarket = `${w.marketPda.slice(0, 4)}...${w.marketPda.slice(-4)}`;
            const marketName = w.marketDetails?.twitterHandle || "Unknown Creator";

            return (
              <tr key={w.signature} className="border-b border-[#1A1F2B] hover:bg-[#161A22] transition-colors">
                <td className="py-3 text-white whitespace-nowrap">{timeAgo}</td>
                <td className="py-3 font-medium text-green-400">+{amountSol}</td>
                <td className="py-3 font-semibold hover:underline">
                  <Link href={`/creator/${w.marketPda}`} className="flex flex-col">
                    <span className="text-white text-base">{marketName}</span>
                    <span className="text-color-buy text-xs font-normal mt-0.5">{shortMarket}</span>
                  </Link>
                </td>
                <td className="py-3 text-color-muted">
                  <a href={`https://solscan.io/tx/${w.signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    {w.signature.slice(0, 4)}...{w.signature.slice(-4)}
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
