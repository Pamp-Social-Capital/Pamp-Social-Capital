"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);
import bs58 from "bs58";
import { useRouter } from "next/navigation";
import { useSocialCapital } from "../../hooks/useSocialCapital";
import toast from "react-hot-toast";

export default function ClaimPage() {
  const router = useRouter();
  const sdk = useSocialCapital();
  const { publicKey, signMessage } = useWallet();
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "AUTHENTICATED" | "SUCCESS" | "ERROR">("IDLE");
  const [message, setMessage] = useState<string>("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [oauthToken, setOauthToken] = useState("");
  const [isXLinked, setIsXLinked] = useState(false);
  const [createdMarketPda, setCreatedMarketPda] = useState("");

  const handleClaim = async () => {
    if (!publicKey || !signMessage) {
      setMessage("Please connect your wallet first.");
      setStatus("ERROR");
      return;
    }

    try {
      setStatus("LOADING");
      const loadingId = toast.loading("Requesting challenge from server...");
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const challengeRes = await fetch(`${apiUrl}/api/auth/challenge?wallet=${publicKey.toBase58()}`);
      const challengeData = await challengeRes.json();
      
      if (!challengeData.success) {
        throw new Error(challengeData.error || "Failed to get challenge");
      }
      
      toast.loading("Please sign the message in your wallet...", { id: loadingId });
      const messageUint8 = new TextEncoder().encode(challengeData.message);
      const signature = await signMessage(messageUint8);
      
      toast.loading("Verifying signature...", { id: loadingId });
      const verifyRes = await fetch(`${apiUrl}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          message: challengeData.message,
          signature: bs58.encode(signature)
        })
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || "Failed to verify signature");
      }
      
      localStorage.setItem("walletToken", verifyData.token);
      setStatus("AUTHENTICATED");
      toast.success("Wallet authenticated! Please link your X account.", { id: loadingId });

    } catch (err: any) {
      console.error(err);
      setStatus("ERROR");
      toast.error(err.message || "An unknown error occurred");
    }
  };

  useEffect(() => {
    // Check if returning from OAuth
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("oauth_token");
      const handle = params.get("handle");
      
      if (token && handle) {
        const linkTwitter = async () => {
          try {
            const walletToken = localStorage.getItem("walletToken");
            if (!walletToken) {
              throw new Error("Wallet not authenticated. Please connect wallet first.");
            }
            
            setStatus("LOADING");
            const loadingId = toast.loading("Linking X account to your wallet...");
            
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const linkRes = await fetch(`${apiUrl}/api/oauth/twitter/link`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ oauthToken: token, walletToken })
            });
            
            const linkData = await linkRes.json();
            if (!linkData.success) {
              throw new Error(linkData.error || "Failed to link Twitter account");
            }
            
            setOauthToken(token);
            setTwitterHandle(handle);
            setIsXLinked(true);
            
            const isPopup = params.get("popup") === "true";
            
            if (isPopup) {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_LINK_SUCCESS', token, handle }, '*');
              }
              window.close();
              return;
            } else {
              setStatus("AUTHENTICATED");
              toast.success("X account linked successfully!", { id: loadingId });
              // Clean up URL without refreshing
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (err: any) {
            console.error(err);
            const isPopup = params.get("popup") === "true";
            if (isPopup) {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_LINK_ERROR', error: err.message }, '*');
              }
              window.close();
              return;
            }
            
            setStatus("ERROR");
            toast.error(err.message || "An error occurred while linking X account.");
          }
        };
        
        linkTwitter();
      }
    }
  }, []);

  // Listen for popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_LINK_SUCCESS') {
        setOauthToken(event.data.token);
        setTwitterHandle(event.data.handle);
        setIsXLinked(true);
        setStatus("AUTHENTICATED");
        toast.success("X account linked successfully!");
      } else if (event.data?.type === 'OAUTH_LINK_ERROR') {
        setStatus("ERROR");
        toast.error(event.data.error || "An error occurred while linking X account.");
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleOAuthLogin = () => {
    setStatus("LOADING");
    setMessage("Waiting for X (Twitter) authentication...");
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const redirectUrl = encodeURIComponent(window.location.origin + "/claim?popup=true");
    
    // Open in popup modal
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      `${apiUrl}/api/oauth/twitter/login?redirect_to=${redirectUrl}`,
      "TwitterLogin",
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0`
    );
  };

  const handleCreateMarket = async () => {
    if (!twitterHandle || !isXLinked) {
      setMessage("Please link your X (Twitter) handle first.");
      setStatus("ERROR");
      return;
    }
    
    if (!sdk || !publicKey) {
      setMessage("Wallet not connected or SDK not initialized.");
      setStatus("ERROR");
      return;
    }

    let loadingId: string | undefined;

    try {
      setStatus("LOADING");
      loadingId = toast.loading("Requesting approval from wallet to create market on-chain...");
      
      // Convert handle to 32 bytes zero-padded array
      const textBytes = new TextEncoder().encode(twitterHandle);
      if (textBytes.length > 32) {
        throw new Error("Handle is too long");
      }
      
      const creatorIdArray = new Array(32).fill(0);
      for (let i = 0; i < textBytes.length; i++) {
        creatorIdArray[i] = textBytes[i];
      }
      
      // Get the PDA so we can redirect to the creator page
      const marketPda = sdk.getCreatorMarketPda(new Uint8Array(creatorIdArray));
      
      // Check market state first
      let marketState = null;
      try {
        marketState = await sdk.program.account.creatorMarket.fetch(marketPda);
      } catch (e) {
        // Doesn't exist yet
      }
      
      if (!marketState) {
        // Send transaction via SDK to create market
        await sdk.createCreatorMarket(creatorIdArray);
        toast.loading(`Market Created! Claiming market ownership...`, { id: loadingId });
      }

      if (!marketState || !marketState.claimed) {
        // We need to claim the market using Ed25519 verification
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const walletToken = localStorage.getItem("walletToken");
        
        toast.loading("Requesting backend signature for claim...", { id: loadingId });
        
        const sigRes = await fetch(`${apiUrl}/api/auth/claim-signature`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${walletToken}`
          },
          body: JSON.stringify({ marketPda: marketPda.toBase58() })
        });
        
        const sigData = await sigRes.json();
        if (!sigData.success) {
          throw new Error(sigData.error || "Failed to fetch claim signature");
        }
        
        const { Transaction, Ed25519Program } = await import("@solana/web3.js");
        const tx = new Transaction();
        
        // 1. Add Ed25519 signature instruction
        tx.add(
          Ed25519Program.createInstructionWithPublicKey({
            publicKey: bs58.decode(sigData.pubkey),
            message: new TextEncoder().encode(sigData.message),
            signature: bs58.decode(sigData.signature),
          })
        );
        
        // 2. Add Claim Creator instruction
        const claimIx = await sdk.claimCreatorInstruction(new Uint8Array(creatorIdArray));
        tx.add(claimIx);
        
        toast.loading("Approve claim transaction...", { id: loadingId });
        
        const provider = sdk.program.provider as any;
        const txSig = await provider.sendAndConfirm(tx);
        
        // Sync market immediately to avoid webhook delays
        try {
          await fetch(`${apiUrl}/api/markets/${marketPda.toBase58()}/sync`, { method: "POST" });
        } catch (e) {
          console.error("Failed to sync market:", e);
        }

        setStatus("SUCCESS");
        toast.success(`Market Claimed Successfully!`, { id: loadingId });
        setCreatedMarketPda(marketPda.toBase58());
      } else {
        // Even if it's already claimed, sync it just in case
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
          await fetch(`${apiUrl}/api/markets/${marketPda.toBase58()}/sync`, { method: "POST" });
        } catch (e) {
          console.error("Failed to sync market:", e);
        }

        setStatus("SUCCESS");
        toast.success(`Market is already fully set up and claimed!`, { id: loadingId });
        setCreatedMarketPda(marketPda.toBase58());
      }
    } catch (err: any) {
      console.error("Transaction Error:", err);
      if (err.logs) console.error("Logs:", err.logs);
      setStatus("ERROR");
      
      let cleanMessage = "Transaction failed. Please try again.";
      if (err.message) {
        if (err.message.includes("already in use")) {
          cleanMessage = "This market has already been created/claimed.";
        } else if (err.message.includes("User rejected") || err.message.includes("cancelled")) {
          cleanMessage = "Transaction was cancelled by user.";
        } else if (err.message.includes("Simulation failed")) {
          cleanMessage = "Transaction simulation failed. Check console for details.";
        } else {
          cleanMessage = err.message.length > 100 ? "Transaction failed. Check console for details." : err.message;
        }
      }
      toast.error(cleanMessage, { id: loadingId || "claim-error" });
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
        ) : status === "IDLE" || status === "ERROR" || (status === "LOADING" && !isXLinked && !twitterHandle) ? (
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
        ) : status === "AUTHENTICATED" || (status === "LOADING" && (twitterHandle || isXLinked)) ? (
          <div className="flex flex-col items-center gap-6 w-full mt-4">
            <div className="text-center w-full">
              <p className="text-white font-semibold text-lg mb-1">Step 3: Link X Identity</p>
              <p className="text-color-muted text-sm mb-4">
                {isXLinked ? "Identity verified via X." : "Click below to authenticate your X (Twitter) account."}
              </p>
              
              {isXLinked && (
                <div className="w-full bg-white/10 border border-white/30 rounded-xl p-4 flex items-center justify-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                  <span className="font-bold text-white">@{twitterHandle}</span>
                  <span className="bg-color-buy text-[#0B0E14] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">VERIFIED</span>
                </div>
              )}
            </div>
            
            {!isXLinked ? (
              <button
                onClick={handleOAuthLogin}
                disabled={status === "LOADING"}
                className="w-full bg-[#161A22] border border-color-border text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {status === "LOADING" ? "Connecting..." : "Connect X"}
              </button>
            ) : (
              <button
                onClick={handleCreateMarket}
                disabled={status === "LOADING"}
                className="w-full bg-[#1DA1F2] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#1DA1F2]/20"
              >
                {status === "LOADING" ? "Creating Market..." : "Launch Market"}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full mt-4">
            <div className="w-16 h-16 bg-color-buy/20 rounded-full flex items-center justify-center text-color-buy mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl mb-1">Market Launched!</p>
              <p className="text-color-muted text-sm">Your bonding curve is now live.</p>
            </div>
            {createdMarketPda && (
              <button
                onClick={() => router.push(`/creator/${createdMarketPda}`)}
                className="mt-4 w-full bg-[#1DA1F2] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-[#1DA1F2]/20"
              >
                View Your Market
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
