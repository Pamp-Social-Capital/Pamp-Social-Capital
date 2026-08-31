"use client";

import React, { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useSocialCapital } from "../hooks/useSocialCapital";
import { PublicKey } from "@solana/web3.js";
import toast from "react-hot-toast";

interface CreatorDashboardProps {
  marketPda: string;
  creatorWallet: string;
}

export const CreatorDashboard = ({ marketPda, creatorWallet }: CreatorDashboardProps) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const sdk = useSocialCapital();
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<{ totalVolumeLamports: string, holderCount: number } | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Check if connected wallet is the creator
  const isCreator = publicKey?.toBase58() === creatorWallet;

  useEffect(() => {
    if (!isCreator || !sdk) return;

    const fetchDashboardData = async () => {
      try {
        const pda = new PublicKey(marketPda);
        const feeVaultPda = sdk.getCreatorFeeVaultPda(pda);
        
        // Fetch vault balance directly from chain
        const balance = await connection.getBalance(feeVaultPda);
        setVaultBalance(balance);

        // Fetch analytics and withdrawals from API
        const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
        
        const [resAnalytics, resWithdrawals] = await Promise.all([
          fetch(`${API_URL}/api/markets/${marketPda}/analytics`),
          fetch(`${API_URL}/api/markets/${marketPda}/withdrawals`)
        ]);
        
        const dataAnalytics = await resAnalytics.json();
        if (dataAnalytics.success && dataAnalytics.analytics) {
          setAnalytics(dataAnalytics.analytics);
        }

        const dataWithdrawals = await resWithdrawals.json();
        if (dataWithdrawals.success && dataWithdrawals.withdrawals) {
          setWithdrawals(dataWithdrawals.withdrawals);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };

    fetchDashboardData();
    // Set up an interval to poll for updates
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [isCreator, sdk, marketPda, connection]);

  if (!isCreator) return null;

  const handleWithdraw = async () => {
    if (!sdk) return;
    
    let loadingId: string | undefined;
    
    try {
      setIsWithdrawing(true);
      loadingId = toast.loading("Requesting withdrawal from wallet...");
      
      const marketState = await sdk.program.account.creatorMarket.fetch(new PublicKey(marketPda));
      const creatorId = marketState.creatorId;

      toast.loading("Withdrawing fees...", { id: loadingId });
      const signature = await sdk.claimCreatorFees(new Uint8Array(creatorId));
      
      toast.success("Fees withdrawn successfully!", { id: loadingId });
      
      // Optimistically update balance
      setVaultBalance(0);
    } catch (err: any) {
      console.error(err);
      if (typeof loadingId !== 'undefined') {
          toast.error(err.message || "Failed to withdraw fees", { id: loadingId });
      } else {
          toast.error(err.message || "Failed to withdraw fees");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formattedBalance = vaultBalance !== null ? (vaultBalance / 1e9).toFixed(4) : "...";
  const formattedVolume = analytics ? (Number(analytics.totalVolumeLamports) / 1e9).toFixed(4) : "...";
  const holderCount = analytics ? analytics.holderCount : "...";

  return (
    <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/40 border border-indigo-500/30 p-6 rounded-2xl shadow-lg mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
            Creator Dashboard
          </h2>
          <p className="text-indigo-200/70 text-sm mt-1">Manage your market and accumulated fees.</p>
        </div>
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing || vaultBalance === 0 || vaultBalance === null}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          {isWithdrawing ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          )}
          Withdraw Fees
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0B0E14]/50 rounded-xl p-4 border border-indigo-500/20">
          <div className="text-indigo-200/70 text-sm mb-1">Accumulated Fees</div>
          <div className="text-2xl font-bold text-white">{formattedBalance} SOL</div>
        </div>
        <div className="bg-[#0B0E14]/50 rounded-xl p-4 border border-indigo-500/20">
          <div className="text-indigo-200/70 text-sm mb-1">Total Volume</div>
          <div className="text-2xl font-bold text-white">{formattedVolume} SOL</div>
        </div>
        <div className="bg-[#0B0E14]/50 rounded-xl p-4 border border-indigo-500/20">
          <div className="text-indigo-200/70 text-sm mb-1">Unique Holders</div>
          <div className="text-2xl font-bold text-white">{holderCount}</div>
        </div>
      </div>

      {withdrawals.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Withdrawal History</h3>
          <div className="bg-[#0B0E14]/50 rounded-xl border border-indigo-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-indigo-900/20 text-indigo-300 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Amount (SOL)</th>
                    <th className="px-6 py-4">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-500/10">
                  {withdrawals.map((w: any) => (
                    <tr key={w.id} className="hover:bg-indigo-900/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        {new Date(w.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-green-400">
                        +{(w.amount / 1e9).toFixed(4)}
                      </td>
                      <td className="px-6 py-4">
                        <a 
                          href={`https://solscan.io/tx/${w.signature}${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          {w.signature.slice(0, 4)}...{w.signature.slice(-4)}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
