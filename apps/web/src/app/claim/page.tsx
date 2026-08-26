"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import bs58 from "bs58";

export default function ClaimPage() {
  const { publicKey, signMessage } = useWallet();
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [message, setMessage] = useState<string>("");

  const handleClaim = async () => {
    if (!publicKey || !signMessage) {
      setMessage("Please connect your wallet first.");
      setStatus("ERROR");
      return;
    }

    try {
      setStatus("LOADING");
      setMessage("Requesting challenge from server...");

      const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

      // 1. Get challenge
      const challengeRes = await fetch(`${API_URL}/api/auth/challenge?wallet=${publicKey.toBase58()}`);
      const challengeData = await challengeRes.json();

      if (!challengeData.success) {
        throw new Error(challengeData.error || "Failed to get challenge");
      }

      setMessage("Please sign the message in your wallet...");

      // 2. Sign message
      const messageBytes = new TextEncoder().encode(challengeData.message);
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);

      setMessage("Verifying signature...");

      // 3. Verify signature
      const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature: signatureBase58,
          message: challengeData.message,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        throw new Error(verifyData.error || "Failed to verify signature");
      }

      // In a full implementation, we would store the token (e.g., localStorage)
      // and redirect to the specific market dashboard.
      localStorage.setItem("social_capital_token", verifyData.token);
      
      setStatus("SUCCESS");
      setMessage("Market claimed successfully! Redirecting...");
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
          Connect your creator wallet and sign a secure challenge to initialize your bonding curve and launch your Social Capital market.
        </p>
      </div>

      <div className="bg-color-card border border-color-border p-8 rounded-2xl w-full max-w-md flex flex-col gap-8 items-center shadow-2xl relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-color-buy to-transparent opacity-50" />
        
        {/* Steps Tracker */}
        <div className="w-full flex justify-between px-4 relative">
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-color-border -z-10 -translate-y-1/2" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${publicKey ? "bg-color-buy text-[#0B0E14]" : "bg-[#161A22] border-2 border-color-muted text-color-muted"}`}>1</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${status === "SUCCESS" ? "bg-color-buy text-[#0B0E14]" : (publicKey ? "bg-[#161A22] border-2 border-color-buy text-color-buy" : "bg-[#161A22] border-2 border-color-muted text-color-muted")}`}>2</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${status === "SUCCESS" ? "bg-color-buy text-[#0B0E14]" : "bg-[#161A22] border-2 border-color-muted text-color-muted"}`}>3</div>
        </div>

        {!publicKey ? (
          <div className="flex flex-col items-center gap-6 w-full mt-4">
            <p className="text-white font-semibold text-lg">Step 1: Connect Wallet</p>
            <WalletMultiButton className="!bg-[#161A22] !border !border-color-border hover:!border-color-buy !transition-all !text-white !h-12 !px-8 !rounded-xl !font-sans !font-semibold w-full flex justify-center shadow-lg" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full mt-4">
            <div className="text-center">
              <p className="text-white font-semibold text-lg mb-1">Step 2: Authenticate</p>
              <p className="text-color-muted text-xs break-all bg-[#0B0E14] border border-color-border px-3 py-2 rounded-lg font-mono">
                {publicKey.toBase58()}
              </p>
            </div>
            
            {status !== "SUCCESS" ? (
              <button
                onClick={handleClaim}
                disabled={status === "LOADING"}
                className="w-full bg-color-buy text-[#0B0E14] font-bold py-3.5 px-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-color-buy/20 shadow-lg"
              >
                {status === "LOADING" ? "Awaiting Signature..." : "Sign Challenge"}
              </button>
            ) : (
              <div className="w-full bg-color-buy bg-opacity-10 border border-color-buy text-color-buy p-4 text-center rounded-xl font-semibold">
                Market Created Successfully!
              </div>
            )}
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
