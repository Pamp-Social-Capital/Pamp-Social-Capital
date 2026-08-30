"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import useSWR from "swr";
import Link from "next/link";
import { UserTradeHistoryComponent } from "@/components/UserTradeHistory";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PortfolioPage() {
  const { publicKey } = useWallet();

  const { data, error, isLoading } = useSWR(
    publicKey
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${publicKey.toBase58()}`
      : null,
    fetcher
  );

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <h1 className="text-2xl font-bold text-white">Connect your wallet</h1>
        <p className="text-color-muted">Please connect your wallet to view your portfolio.</p>
      </div>
    );
  }

  const positions = data?.portfolio || [];

  // Calculate aggregates
  const totalValueLamports = positions.reduce((acc: bigint, pos: any) => acc + BigInt(pos.currentValueLamports), BigInt(0));
  const totalValueSol = (Number(totalValueLamports) / 1e9).toFixed(2);
  
  const totalPnLLamports = positions.reduce((acc: bigint, pos: any) => acc + BigInt(pos.pnlLamports), BigInt(0));
  const totalPnLSol = (Number(totalPnLLamports) / 1e9).toFixed(2);
  
  const totalKeys = positions.reduce((acc: number, pos: any) => acc + pos.keyBalance, 0);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Profile */}
      <div className="flex items-center gap-6 mt-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Your Portfolio
          </h1>
          <p className="text-color-muted text-sm mt-1 mb-3">Track your performance and manage your Creator Keys.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#1FC782]/20 to-transparent p-6 rounded-2xl border border-color-border shadow-lg relative overflow-hidden">
             <div className="text-color-muted text-sm mb-1">Total Value</div>
             <div className="text-3xl font-bold text-white">{totalValueSol} <span className="text-sm font-normal text-color-muted">SOL</span></div>
             <div className="absolute top-0 right-0 w-24 h-24 bg-color-buy opacity-10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          </div>
          <div className="bg-gradient-to-br from-[#1FC782]/20 to-transparent p-6 rounded-2xl border border-color-border shadow-lg">
             <div className="text-color-muted text-sm mb-1">Total PnL</div>
             <div className={`text-3xl font-bold ${totalPnLLamports >= 0 ? 'text-color-buy' : 'text-color-sell'}`}>
                {totalPnLLamports >= 0 ? '+' : ''}{totalPnLSol} SOL
             </div>
          </div>
          <div className="bg-color-card p-6 rounded-2xl border border-color-border shadow-lg">
             <div className="text-color-muted text-sm mb-1">Keys Held</div>
             <div className="text-3xl font-bold text-white">{totalKeys}</div>
          </div>
          <div className="bg-color-card p-6 rounded-2xl border border-color-border shadow-lg">
             <div className="text-color-muted text-sm mb-1">Markets</div>
             <div className="text-3xl font-bold text-white">{positions.length}</div>
          </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-4">Your Keys</h2>
      
      {/* Portfolio Holdings */}
      <section className="bg-color-card border border-color-border p-6 rounded-2xl shadow-lg">
        {isLoading ? (
          <div className="overflow-x-auto animate-pulse">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-color-muted border-b border-color-border">
                  <th className="pb-4"><div className="h-4 w-24 bg-white/5 rounded"></div></th>
                  <th className="pb-4"><div className="h-4 w-16 bg-white/5 rounded"></div></th>
                  <th className="pb-4"><div className="h-4 w-20 bg-white/5 rounded"></div></th>
                  <th className="pb-4"><div className="h-4 w-20 bg-white/5 rounded"></div></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-color-border/50">
                    <td className="py-4"><div className="h-4 w-20 bg-white/5 rounded"></div></td>
                    <td className="py-4"><div className="h-4 w-8 bg-white/5 rounded"></div></td>
                    <td className="py-4"><div className="h-4 w-16 bg-white/5 rounded"></div></td>
                    <td className="py-4"><div className="h-4 w-16 bg-white/5 rounded"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
           <div className="text-center py-12 text-color-sell">Error loading portfolio</div>
        ) : positions.length === 0 ? (
           <div className="text-center py-12 text-color-muted">You do not own any creator keys yet. <br/><Link href="/" className="text-color-buy hover:underline mt-2 inline-block">Explore Markets</Link></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-color-muted border-b border-color-border">
                  <th className="pb-4 font-medium">Creator PDA</th>
                  <th className="pb-4 font-medium">Balance (Keys)</th>
                  <th className="pb-4 font-medium">Total Value (SOL)</th>
                  <th className="pb-4 font-medium">PnL (SOL)</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {positions.map((pos: any, i: number) => {
                  const valSol = (Number(pos.currentValueLamports) / 1e9).toFixed(4);
                  const pnlSol = (Number(pos.pnlLamports) / 1e9).toFixed(4);
                  const isPositive = Number(pos.pnlLamports) >= 0;
                  
                  return (
                    <tr key={i} className="border-b border-color-border/50 hover:bg-white/5 transition-colors">
                      <td className="py-4 font-semibold text-color-buy hover:underline">
                        <Link href={`/creator/${pos.marketPda}`}>{pos.marketPda.substring(0,8)}...</Link>
                      </td>
                      <td className="py-4">{pos.keyBalance}</td>
                      <td className="py-4 font-medium">{valSol}</td>
                      <td className={`py-4 font-semibold ${isPositive ? 'text-color-buy' : 'text-color-sell'}`}>
                        {isPositive ? '+' : ''}{pnlSol}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* User Trade History */}
      <UserTradeHistoryComponent />
    </div>
  );
}
