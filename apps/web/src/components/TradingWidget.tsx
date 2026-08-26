"use client";

import { FC, useState } from "react";

export const TradingWidget: FC<{ marketPda: string }> = ({ marketPda }) => {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleTrade = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    // TODO: Implement actual trade via Anchor SDK
    setModalMessage(`Successfully placed a simulated ${tradeType.toUpperCase()} order of ${amount} SOL.`);
    setShowModal(true);
    setAmount("");
  };

  // Mock calculations for UI presentation
  const parsedAmount = parseFloat(amount) || 0;
  const estimatedKeys = (parsedAmount * 125.4).toFixed(2);
  const creatorFee = (parsedAmount * 0.05).toFixed(4); // 5% fee
  const protocolFee = (parsedAmount * 0.02).toFixed(4); // 2% fee

  return (
    <>
      <div className="bg-color-card rounded-2xl p-6 border border-color-border shadow-2xl relative">
        {/* Toggle Buttons */}
        <div className="flex gap-2 mb-6 bg-[#0B0E14] p-1.5 rounded-xl border border-color-border">
          <button
            className={`flex-1 py-2.5 text-center font-semibold text-sm rounded-lg transition-all ${
              tradeType === "buy" 
                ? "bg-color-buy text-[#0B0E14] shadow-md" 
                : "text-color-muted hover:text-white"
            }`}
            onClick={() => setTradeType("buy")}
          >
            Buy
          </button>
          <button
            className={`flex-1 py-2.5 text-center font-semibold text-sm rounded-lg transition-all ${
              tradeType === "sell" 
                ? "bg-color-sell text-white shadow-md" 
                : "text-color-muted hover:text-white"
            }`}
            onClick={() => setTradeType("sell")}
          >
            Sell
          </button>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2 text-color-muted font-medium">
            <span>Amount (SOL)</span>
            <span>Balance: 0.00 SOL</span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0B0E14] border border-color-border rounded-xl p-4 text-xl font-medium text-white focus:outline-none focus:border-color-buy focus:ring-1 focus:ring-color-buy transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-color-muted font-medium">SOL</span>
          </div>
        </div>

        {/* Itemized Receipt */}
        <div className="mb-6 p-4 bg-[#0B0E14] rounded-xl border border-color-border text-sm flex flex-col gap-3">
          <div className="flex justify-between">
            <span className="text-color-muted">Estimated Keys</span>
            <span className="font-semibold text-white">{parsedAmount > 0 ? estimatedKeys : "--"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-color-muted">Creator Fee (5%)</span>
            <span className="text-color-foreground">{parsedAmount > 0 ? creatorFee : "--"} SOL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-color-muted">Protocol Fee (2%)</span>
            <span className="text-color-foreground">{parsedAmount > 0 ? protocolFee : "--"} SOL</span>
          </div>
          <div className="border-t border-color-border pt-3 mt-1 flex justify-between font-semibold">
            <span className="text-white">Total</span>
            <span className="text-white">{parsedAmount > 0 ? (parsedAmount + parseFloat(creatorFee) + parseFloat(protocolFee)).toFixed(4) : "--"} SOL</span>
          </div>
        </div>

        <button
          onClick={handleTrade}
          className={`w-full py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
            tradeType === "buy" 
              ? "bg-color-buy text-[#0B0E14] hover:bg-opacity-90 shadow-color-buy/20" 
              : "bg-color-sell text-white hover:bg-opacity-90 shadow-color-sell/20"
          }`}
        >
          {tradeType === "buy" ? "Place Buy Order" : "Place Sell Order"}
        </button>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-color-card border border-color-border p-6 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-color-buy to-color-sell opacity-70" />
             <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-8 rounded-full bg-color-buy/20 flex items-center justify-center text-color-buy">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
               </div>
               <h3 className="text-xl font-bold text-white">Order Submitted</h3>
             </div>
             <p className="text-color-muted text-sm mb-6 pl-11">{modalMessage}</p>
             <button 
               onClick={() => setShowModal(false)} 
               className="w-full bg-[#161A22] border border-color-border text-white py-2.5 rounded-xl hover:bg-white/10 transition-colors font-semibold"
             >
               Close
             </button>
          </div>
        </div>
      )}
    </>
  );
};
