"use client";

import React, { useEffect, useState } from 'react';

interface Trade {
  signature: string;
  marketPda: string;
  traderWallet: string;
  tradeType: string;
  amount: number;
  lamports: string;
  feeLamports: string;
  timestamp: string;
}

export const TradeHistoryComponent = ({ marketPda }: { marketPda: string }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial trades
    const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
    fetch(`${API_URL}/api/markets/${marketPda}/trades`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.trades) {
          setTrades(data.trades);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load historical trades:", err);
        setLoading(false);
      });

    // Connect WebSocket for live updates
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL as string || "";
    const WS_URL = baseUrl.endsWith('/ws') ? baseUrl : `${baseUrl}/ws`;
    if (!WS_URL || WS_URL === "/ws") return;
    
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      // Subscribe to the market trades
      ws.send(JSON.stringify({ type: "subscribe", marketPda }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "trade" && msg.data && msg.data.marketPda === marketPda) {
          setTrades(prev => [msg.data, ...prev].slice(0, 50));
        }
      } catch (e) {
        console.error("Failed to process websocket message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [marketPda]);

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-color-border text-color-muted text-sm uppercase">
              <th className="py-3 font-semibold">Type</th>
              <th className="py-3 font-semibold">Keys</th>
              <th className="py-3 font-semibold">Amount (SOL)</th>
              <th className="py-3 font-semibold">Trader</th>
              <th className="py-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-[#1A1F2B]">
                <td className="py-4"><div className="h-4 w-12 bg-white/5 rounded animate-pulse"></div></td>
                <td className="py-4"><div className="h-4 w-8 bg-white/5 rounded animate-pulse"></div></td>
                <td className="py-4"><div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div></td>
                <td className="py-4"><div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div></td>
                <td className="py-4"><div className="h-4 w-20 bg-white/5 rounded animate-pulse"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (trades.length === 0) {
    return <div className="text-center py-8 text-color-muted">No recent trades found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-color-border text-color-muted text-sm uppercase">
            <th className="py-3 font-semibold">Type</th>
            <th className="py-3 font-semibold">Keys</th>
            <th className="py-3 font-semibold">Amount (SOL)</th>
            <th className="py-3 font-semibold">Trader</th>
            <th className="py-3 font-semibold">Time</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {trades.map((trade) => {
            const isBuy = trade.tradeType === "buy";
            const amountSol = (Number(trade.lamports) / 1e9).toFixed(4);
            const timeAgo = new Date(trade.timestamp).toLocaleTimeString();
            const shortWallet = `${trade.traderWallet.slice(0, 4)}...${trade.traderWallet.slice(-4)}`;

            return (
              <tr key={trade.signature} className="border-b border-[#1A1F2B] hover:bg-[#161A22] transition-colors">
                <td className={`py-3 font-medium ${isBuy ? 'text-color-buy' : 'text-color-sell'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </td>
                <td className="py-3 text-white">{trade.amount}</td>
                <td className="py-3 text-white">{amountSol}</td>
                <td className="py-3 text-color-muted font-mono">
                  <a href={`https://solscan.io/account/${trade.traderWallet}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    {shortWallet}
                  </a>
                </td>
                <td className="py-3 text-color-muted">
                  <a href={`https://solscan.io/tx/${trade.signature}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    {timeAgo}
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
