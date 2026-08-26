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
      setMessage("Market claimed successfully! (Simulated)");
    } catch (err: any) {
      console.error(err);
      setStatus("ERROR");
      setMessage(err.message || "An unknown error occurred");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-color-foreground mb-4">[ CLAIM YOUR MARKET ]</h1>
        <p className="text-color-muted max-w-md mx-auto">
          Connect your creator wallet and sign a cryptographically secure challenge to prove ownership of your Social Capital market.
        </p>
      </div>

      <div className="bg-color-card border border-color-border p-8 w-full max-w-md flex flex-col gap-6 items-center">
        {!publicKey ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-color-muted text-sm">Step 1: Connect your wallet</p>
            <WalletMultiButton className="!bg-color-background !border !border-color-border hover:!border-color-primary !transition-colors !text-color-foreground !h-12 !px-8" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="text-color-primary font-mono text-sm break-all text-center">
              Connected: {publicKey.toBase58()}
            </p>
            
            {status !== "SUCCESS" ? (
              <button
                onClick={handleClaim}
                disabled={status === "LOADING"}
                className="w-full bg-color-primary text-color-background font-bold py-3 px-4 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {status === "LOADING" ? "PROCESSING..." : "SIGN CHALLENGE & CLAIM"}
              </button>
            ) : (
              <div className="w-full bg-color-buy bg-opacity-10 border border-color-buy text-color-buy p-4 text-center">
                ACCESS GRANTED
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`w-full p-4 border font-mono text-sm text-center ${
            status === "ERROR" ? "border-color-sell text-color-sell" :
            status === "SUCCESS" ? "border-color-buy text-color-buy" :
            "border-color-muted text-color-muted"
          }`}>
            {status === "LOADING" && <span className="blink mr-2">&gt;</span>}
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
