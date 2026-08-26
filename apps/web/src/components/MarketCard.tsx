import Link from "next/link";
import { FC } from "react";

export interface Market {
  id: string;
  marketPda: string;
  creatorId: string;
  supply: number;
  reserveLamports: number;
  totalVolumeLamports: string;
  // Mock data for UI
  username?: string;
  avatarUrl?: string;
}

export const MarketCard: FC<{ market: Market }> = ({ market }) => {
  // Convert lamports to SOL for display
  const volumeSol = (Number(market.totalVolumeLamports) / 1e9).toFixed(2);
  const reserveSol = (market.reserveLamports / 1e9).toFixed(2);

  return (
    <Link href={`/creator/${market.marketPda}`} className="block">
      <div className="border border-color-border bg-color-card p-4 hover:border-color-foreground transition-colors group h-full flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-color-border rounded-sm overflow-hidden border border-color-muted group-hover:border-color-foreground transition-colors">
              {market.avatarUrl ? (
                <img src={market.avatarUrl} alt="Avatar" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-color-muted">IMG</div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-color-foreground">{market.username || "UNKNOWN_CREATOR"}</h3>
              <p className="text-xs text-color-muted truncate w-32">{market.marketPda}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-color-muted">VOL</div>
            <div className="font-bold text-color-buy">{volumeSol} SOL</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm border-t border-color-border pt-4 mt-auto">
          <div>
            <div className="text-color-muted text-xs">SUPPLY</div>
            <div>{market.supply.toLocaleString()} KEYS</div>
          </div>
          <div className="text-right">
            <div className="text-color-muted text-xs">LIQUIDITY</div>
            <div>{reserveSol} SOL</div>
          </div>
        </div>
      </div>
    </Link>
  );
};
