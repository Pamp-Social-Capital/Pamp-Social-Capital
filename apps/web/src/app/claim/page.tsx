"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import bs58 from "bs58";
import { useRouter } from "next/navigation";

export default function ClaimPage() {
  const router = useRouter();
  const { publicKey, signMessage } = useWallet();
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "AUTHENTICATED" | "SUCCESS" | "ERROR">("IDLE");
  const [message, setMessage] = useState<string>("");
  const [twitterHandle, setTwitterHandle] = useState("");

  const handleClaim = async () => {
    if (!publicKey || !signMessage) {
      setMessage("Please connect your wallet first.");
      setStatus("ERROR");
      return;
    }

    try {
      setStatus("LOADING");
      setMessage("Requesting challenge from server...");
      
      // MOCK FLOW FOR UI PURPOSES
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("Please sign the message in your wallet...");
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("AUTHENTICATED");
      setMessage("Wallet authenticated! Please setup your profile.");

    } catch (err: any) {
      console.error(err);
      setStatus("ERROR");
      setMessage(err.message || "An unknown error occurred");
    }
  };

  const handleCreateMarket = async () => {
    if (!twitterHandle) {
      setMessage("Please enter your X (Twitter) handle.");
      setStatus("ERROR");
      return;
    }
    
    try {
      setStatus("LOADING");
      setMessage("Initializing market on-chain...");
      
      // MOCK SUBMIT
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStatus("SUCCESS");
      setMessage("Market Created Successfully! Redirecting to your dashboard...");
      setTimeout(() => {
        router.push("/portfolio");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatus("ERROR");
      setMessage(err.message || "An unknown error occurred");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-center mt-8">
        <h1 className="text-4xl font-bold text-white mb-4">Create Your Market</h1>
        <p className="text-color-muted max-w-md mx-auto text-sm">
          Connect your creator wallet, authenticate, and link your X identity to launch your Social Capital market.
        </p>
      </div>

      <div className="bg-color-card border border-color-border p-8 rounded-2xl w-full max-w-md flex flex-col gap-8 items-center shadow-2xl relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-color-buy to-transparent opacity-50" />
        
        {/* Steps Tracker */}
        <div className="w-full flex justify-between px-4 relative">
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-color-border -z-10 -translate-y-1/2" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${publicKey ? "bg-color-buy text-[#0B0E14]" : "bg-[#161A22] border-2 border-color-muted text-color-muted"}`}>1</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${(status === "AUTHENTICATED" || status === "SUCCESS") ? "bg-color-buy text-[#0B0E14]" : (publicKey ? "bg-[#161A22] border-2 border-color-buy text-color-buy" : "bg-[#161A22] border-2 border-color-muted text-color-muted")}`}>2</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${status === "SUCCESS" ? "bg-color-buy text-[#0B0E14]" : (status === "AUTHENTICATED" ? "bg-[#161A22] border-2 border-color-buy text-color-buy" : "bg-[#161A22] border-2 border-color-muted text-color-muted")}`}>3</div>
        </div>

        {!publicKey ? (
          <div className="flex flex-col items-center gap-6 w-full mt-4">
            <p className="text-white font-semibold text-lg">Step 1: Connect Wallet</p>
            <WalletMultiButton className="!bg-[#161A22] !border !border-color-border hover:!border-color-buy !transition-all !text-white !h-12 !px-8 !rounded-xl !font-sans !font-semibold w-full flex justify-center shadow-lg" />
          </div>
        ) : status === "IDLE" || status === "ERROR" || (status === "LOADING" && !twitterHandle) ? (
          <div className="flex flex-col items-center gap-6 w-full mt-4">
            <div className="text-center">
              <p className="text-white font-semibold text-lg mb-1">Step 2: Authenticate</p>
              <p className="text-color-muted text-xs break-all bg-[#0B0E14] border border-color-border px-3 py-2 rounded-lg font-mono">
                {publicKey.toBase58()}
              </p>
            </div>
            
            <button
              onClick={handleClaim}
              disabled={status === "LOADING"}
              className="w-full bg-color-buy text-[#0B0E14] font-bold py-3.5 px-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-color-buy/20 shadow-lg"
            >
              {status === "LOADING" ? "Awaiting Signature..." : "Sign Challenge"}
            </button>
          </div>
        ) : status === "AUTHENTICATED" || (status === "LOADING" && twitterHandle) ? (
          <div className="flex flex-col items-center gap-6 w-full mt-4">
            <div className="text-center w-full">
              <p className="text-white font-semibold text-lg mb-1">Step 3: Link X Identity</p>
              <p className="text-color-muted text-sm mb-4">What is your X (Twitter) handle?</p>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-color-muted font-bold">@</span>
                <input 
                  type="text" 
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  placeholder="username"
                  className="w-full bg-[#0B0E14] border border-color-border rounded-xl p-3.5 pl-9 text-white font-medium focus:outline-none focus:border-color-buy transition-colors"
                />
              </div>
            </div>
            
            <button
              onClick={handleCreateMarket}
              disabled={status === "LOADING" || !twitterHandle}
              className="w-full bg-[#1DA1F2] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#1DA1F2]/20"
            >
              {status === "LOADING" ? "Creating Market..." : "Launch Market"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full mt-4">
            <div className="w-16 h-16 bg-color-buy/20 rounded-full flex items-center justify-center text-color-buy mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl mb-1">Market Launched!</p>
              <p className="text-color-muted text-sm">Your bonding curve is now live on Devnet.</p>
            </div>
          </div>
        )}

        {message && (
          <div className={`w-full p-4 rounded-xl text-sm text-center border ${
            status === "ERROR" ? "bg-color-sell/10 border-color-sell text-color-sell" :
            status === "SUCCESS" ? "bg-color-buy/10 border-color-buy text-color-buy" :
            "bg-[#0B0E14] border-color-border text-white"
          }`}>
            {status === "LOADING" && <span className="inline-block animate-spin mr-2">⟳</span>}
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
