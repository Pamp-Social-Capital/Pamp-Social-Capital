import React from 'react';

interface PortfolioStatsCardProps {
  totalValueSol: string;
  totalKeys: number;
  totalPnLLamports: bigint;
  totalPnLSol: string;
  totalFeesSol: string;
  netProfitLamports: bigint;
  netProfitSol: string;
}

export const PortfolioStatsCard: React.FC<PortfolioStatsCardProps> = ({
  totalValueSol,
  totalKeys,
  totalPnLLamports,
  totalPnLSol,
  totalFeesSol,
  netProfitLamports,
  netProfitSol,
}) => {
  return (
    <div className="w-full bg-background rounded-xl p-6 border border-color-border shadow-lg text-left hover:border-color-buy/50 transition-colors group">
      <h2 className="text-base font-bold text-white mb-4">Portfolio Stats</h2>
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex justify-between border-b border-color-border/50 pb-3">
          <span className="text-color-muted">Portfolio Value</span>
          <span className="font-semibold text-white">{totalValueSol} SOL</span>
        </div>
        <div className="flex justify-between border-b border-color-border/50 pb-3">
          <span className="text-color-muted">Keys Held</span>
          <span className="font-semibold text-white">{totalKeys}</span>
        </div>
        <div className="flex justify-between border-b border-color-border/50 pb-3">
          <span className="text-color-muted">Trading PnL</span>
          <span className={`font-semibold ${totalPnLLamports >= 0 ? 'text-color-buy' : 'text-color-sell'}`}>
            {totalPnLLamports >= 0 ? '+' : ''}{totalPnLSol} SOL
          </span>
        </div>
        <div className="flex justify-between border-b border-color-border/50 pb-3">
          <span className="text-color-muted">Creator Fees</span>
          <span className="font-semibold text-blue-400">
            +{totalFeesSol} SOL
          </span>
        </div>
        <div className="flex justify-between pb-1">
          <span className="text-color-muted">Total Net Profit</span>
          <span className={`font-semibold ${netProfitLamports >= 0 ? 'text-color-buy' : 'text-color-sell'}`}>
            {netProfitLamports >= 0 ? '+' : ''}{netProfitSol} SOL
          </span>
        </div>
      </div>
    </div>
  );
};
