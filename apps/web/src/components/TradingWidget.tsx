"use client";

import { FC, useState } from "react";

export const TradingWidget: FC<{ marketPda: string }> = ({ marketPda }) => {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");

  const handleTrade = () => {
    // TODO: Implement actual trade via Anchor SDK
    alert(`Simulated ${tradeType.toUpperCase()} of ${amount} for market ${marketPda}`);
  };

  return (
    <div className="border border-color-border bg-color-card p-6">
      <div className="flex gap-4 mb-6">
        <button
          className={`flex-1 py-3 text-center font-bold text-lg transition-colors border ${
            tradeType === "buy" 
              ? "border-color-buy bg-color-buy/10 text-color-buy" 
              : "border-color-border text-color-muted hover:border-color-buy/50"
          }`}
          onClick={() => setTradeType("buy")}
        >
          [ BUY ]
        </button>
        <button
          className={`flex-1 py-3 text-center font-bold text-lg transition-colors border ${
            tradeType === "sell" 
              ? "border-color-sell bg-color-sell/10 text-color-sell" 
              : "border-color-border text-color-muted hover:border-color-sell/50"
          }`}
          onClick={() => setTradeType("sell")}
        >
          [ SELL ]
        </button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2 text-color-muted">
          <span>AMOUNT (SOL)</span>
          <span>BALANCE: 0.00 SOL</span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-color-background border border-color-border p-4 text-xl font-mono text-color-foreground focus:outline-none focus:border-color-foreground transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-color-muted">SOL</span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-color-background border border-color-border text-sm flex justify-between">
        <span className="text-color-muted">ESTIMATED KEYS:</span>
        <span className="font-bold">--</span>
      </div>

      <button
        onClick={handleTrade}
        className={`w-full py-4 text-color-background font-bold text-xl transition-colors ${
          tradeType === "buy" ? "bg-color-buy hover:bg-color-buy/80" : "bg-color-sell hover:bg-color-sell/80"
        }`}
      >
        {tradeType === "buy" ? "PLACE BUY ORDER" : "PLACE SELL ORDER"}
      </button>
    </div>
  );
};
