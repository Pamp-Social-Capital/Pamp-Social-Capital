import Link from "next/link";
import { FC } from "react";

export interface Market {
  id: string;
  marketPda: string;
  creatorId: string;
  supply: number;
  reserveLamports: number;
  totalVolumeLamports: string;
  currentPriceLamports: string;
  marketCapLamports: string;
  holderCount: number;
  creatorFeeBps: number;
  username?: string;
  avatarUrl?: string;
}

export const MarketCard: FC<{ market: Market }> = ({ market }) => {
  // Convert lamports to SOL for display
  const volumeSol = (Number(market.totalVolumeLamports) / 1e9).toFixed(2);
  const reserveSol = (market.reserveLamports / 1e9).toFixed(2);
  const priceSol = (Number(market.currentPriceLamports) / 1e9).toFixed(4);
  const mcapSol = (Number(market.marketCapLamports) / 1e9).toFixed(2);
  const feePercent = (market.creatorFeeBps / 100).toFixed(1);
  const initialLetter = (market.username || "U").charAt(0).toUpperCase();

  return (
    <Link href={`/creator/${market.marketPda}`} className="block h-full">
      <div className="bg-color-card rounded-xl p-5 hover:bg-white/5 transition-colors border border-transparent hover:border-color-border group flex flex-col justify-between h-full">
        {/* Header: Avatar, Name, Followers, Action Button */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {market.avatarUrl ? (
                <img src={market.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                initialLetter
              )}
            </div>
            <div>
              <h3 className="font-semibold text-color-foreground text-base leading-tight">{market.username || "Unknown"}</h3>
              <div className="flex items-center text-color-muted text-xs mt-0.5">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                {market.holderCount || 0} Holders
              </div>
            </div>
          </div>
          <button className="bg-color-buy/10 text-color-buy px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-color-buy hover:text-color-background transition-colors">
            Buy Keys
          </button>
        </div>

        {/* Main Metric & Sparkline */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-color-muted text-xs mb-1">Price (SOL)</div>
            <div className="text-2xl font-bold text-color-foreground">{priceSol}</div>
            <div className="text-color-buy text-xs mt-1">{mcapSol} Market Cap</div>
          </div>
          
          {/* Placeholder Sparkline */}
          <div className="flex items-end gap-1 h-8 opacity-70">
            {[4, 6, 3, 7, 5, 8, 4, 9, 6].map((h, i) => (
              <div key={i} className={`w-1.5 rounded-t-sm ${i % 3 === 0 ? 'bg-color-sell' : 'bg-color-buy'}`} style={{ height: `${h * 10}%` }} />
            ))}
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between text-xs pt-4 border-t border-color-border">
          <div>
            <div className="text-color-muted mb-1">Supply</div>
            <div className="text-color-foreground font-medium">{market.supply.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-color-muted mb-1">Creator Fee</div>
            <div className="text-color-foreground font-medium">{feePercent}%</div>
          </div>
          <div className="text-right">
            <div className="text-color-muted mb-1">Reserve</div>
            <div className="text-color-foreground font-medium">{reserveSol} SOL</div>
          </div>
        </div>
      </div>
    </Link>
  );
};
