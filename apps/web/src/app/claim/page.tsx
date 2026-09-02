"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";

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
  const [twitterName, setTwitterName] = useState("");
  const [twitterAvatar, setTwitterAvatar] = useState("");
  const [oauthToken, setOauthToken] = useState("");
  const [isXLinked, setIsXLinked] = useState(false);
  const [createdMarketPda, setCreatedMarketPda] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [bannerInputType, setBannerInputType] = useState<"upload" | "url">("upload");
  const [initialBuyAmount, setInitialBuyAmount] = useState("");

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      setIsUploading(true);
      const { supabase } = await import("../../lib/supabase");
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadErr) {
        throw uploadErr;
      }

      const { data } = supabase.storage.from('banners').getPublicUrl(filePath);
      setBannerUrl(data.publicUrl);
      setUploadedFileName(file.name);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      const errorMessage = error.message || error.error || JSON.stringify(error) || "Failed to upload image";
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const hasLinkedRef = useRef(false);

  useEffect(() => {
    // Check if returning from OAuth
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("oauth_token");
      const handle = params.get("handle");
      const name = params.get("name");
      const avatarUrl = params.get("avatarUrl");

      if (token && handle) {
        const linkTwitter = async () => {
          if (hasLinkedRef.current) return;
          hasLinkedRef.current = true;
          
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
            if (name) setTwitterName(name);
            if (avatarUrl) setTwitterAvatar(avatarUrl);
            setIsXLinked(true);

            const isPopup = params.get("popup") === "true";

            if (isPopup) {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_LINK_SUCCESS', token, handle, name, avatarUrl }, '*');
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
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_LINK_SUCCESS') {
        const handle = event.data.handle;

        // Check if market already exists before proceeding
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const checkRes = await fetch(`${apiUrl}/api/markets/check/${encodeURIComponent(handle)}`);
          const checkData = await checkRes.json();

          if (checkData.exists) {
            toast.error("This X (Twitter) account is already registered as a creator.");
            setStatus("ERROR");
            setMessage(`The account @${handle} already has an active market. Please use a different X account.`);
            return;
          }
        } catch (e) {
          console.error("Failed to check market existence:", e);
        }

        setOauthToken(event.data.token);
        setTwitterHandle(handle);
        if (event.data.name) setTwitterName(event.data.name);
        if (event.data.avatarUrl) setTwitterAvatar(event.data.avatarUrl);
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

    // URL Validation
    const isValidUrl = (urlString: string) => {
      try {
        new URL(urlString);
        return true;
      } catch (e) {
        return false;
      }
    };

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      toast.error("Please enter a valid Website URL (e.g., https://example.com)");
      return;
    }

    if (telegramUrl && !isValidUrl(telegramUrl)) {
      toast.error("Please enter a valid Telegram URL (e.g., https://t.me/example)");
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
        // Check if market already exists in DB for this Twitter Handle
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const checkRes = await fetch(`${apiUrl}/api/markets/check/${encodeURIComponent(twitterHandle)}`);
        const checkData = await checkRes.json();

        if (checkData.exists) {
          toast.dismiss(loadingId);
          toast.error("This X (Twitter) account is already registered as a creator.");
          setStatus("ERROR");
          setMessage("This account already has a market. Please use an unregistered X account.");
          return;
        }

        // Send transaction via SDK to create market
        await sdk.createCreatorMarket(creatorIdArray);
        
        // Sync market immediately so metadata is not lost even if claim fails
        let syncSuccess = false;
        let syncRetries = 0;
        while (!syncSuccess && syncRetries < 4) {
          try {
            const syncRes = await fetch(`${apiUrl}/api/markets/${marketPda.toBase58()}/sync`, { 
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ticker,
                description,
                websiteUrl,
                telegramUrl,
                bannerUrl,
                twitterName,
                avatarUrl: twitterAvatar
              })
            });
            if (syncRes.ok) {
              syncSuccess = true;
            } else {
              await new Promise(r => setTimeout(r, 2000));
              syncRetries++;
            }
          } catch (e) {
            console.error("Failed to sync market:", e);
            await new Promise(r => setTimeout(r, 2000));
            syncRetries++;
          }
        }

        toast.loading(`Market Created! Claiming market ownership...`, { id: loadingId });
      }

      if (!marketState || !marketState.claimed) {
        // We need to claim the market using Ed25519 verification
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const walletToken = localStorage.getItem("walletToken");

        toast.loading("Requesting signature for claim...", { id: loadingId });

        let sigData: any = null;
        let retryCount = 0;
        const maxRetries = 4;
        
        while (retryCount < maxRetries) {
          try {
            const sigRes = await fetch(`${apiUrl}/api/auth/claim-signature`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${walletToken}`
              },
              body: JSON.stringify({ marketPda: marketPda.toBase58(), oauthToken })
            });

            if (sigRes.ok) {
              sigData = await sigRes.json();
              if (sigData.success) break;
            }
            
            // If 404 or not success, wait and retry
            await new Promise(r => setTimeout(r, 2000));
            retryCount++;
          } catch (err) {
            await new Promise(r => setTimeout(r, 2000));
            retryCount++;
          }
        }

        if (!sigData || !sigData.success) {
          throw new Error(sigData?.error || "Failed to fetch claim signature after retries. The network might be congested.");
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

        // 3. Add Initial Buy instruction if requested
        const buyAmountNum = Number(initialBuyAmount);
        if (buyAmountNum > 0) {
          const { BN } = await import("@coral-xyz/anchor");
          // Assuming 1 key = 1 token unit for this example. Adjust decimals if needed.
          const amountBn = new BN(buyAmountNum);
          // Set maxSolCost to a high value for the initial buy to ensure it goes through
          const maxSolCostBn = new BN(100 * 1e9); // 100 SOL max
          
          const buyIx = await sdk.buyKeysInstruction(
            new Uint8Array(creatorIdArray),
            amountBn,
            maxSolCostBn
          );
          tx.add(buyIx);
        }

        toast.loading("Approve claim transaction...", { id: loadingId });

        const provider = sdk.program.provider as any;
        const txSig = await provider.sendAndConfirm(tx);

        // Update sync with tx signature
        try {
          await fetch(`${apiUrl}/api/markets/${marketPda.toBase58()}/sync`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              txSignature: typeof txSig === 'string' ? txSig : undefined,
              ticker,
              description,
              websiteUrl,
              telegramUrl,
              bannerUrl,
              twitterName,
              avatarUrl: twitterAvatar
            })
          });
        } catch (e) {
          console.error("Failed to update market tx sig:", e);
        }

        setStatus("SUCCESS");
        toast.success(`Market Claimed Successfully!`, { id: loadingId });
        setCreatedMarketPda(marketPda.toBase58());
      } else {
        // Even if it's already claimed, sync it just in case
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
          await fetch(`${apiUrl}/api/markets/${marketPda.toBase58()}/sync`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticker,
              description,
              websiteUrl,
              telegramUrl,
              bannerUrl,
              twitterName,
              avatarUrl: twitterAvatar
            })
          });
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${publicKey ? "bg-color-buy text-[#07090c]" : "bg-[#161A22] border-2 border-color-muted text-color-muted"}`}>1</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${(status === "AUTHENTICATED" || status === "SUCCESS") ? "bg-color-buy text-[#07090c]" : (publicKey ? "bg-[#161A22] border-2 border-color-buy text-color-buy" : "bg-[#161A22] border-2 border-color-muted text-color-muted")}`}>2</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${status === "SUCCESS" ? "bg-color-buy text-[#07090c]" : (status === "AUTHENTICATED" ? "bg-[#161A22] border-2 border-color-buy text-color-buy" : "bg-[#161A22] border-2 border-color-muted text-color-muted")}`}>3</div>
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
              <p className="text-color-muted text-xs break-all bg-[#07090c] border border-color-border px-3 py-2 rounded-lg font-mono">
                {publicKey.toBase58()}
              </p>
            </div>

            <button
              onClick={handleClaim}
              disabled={status === "LOADING"}
              className="w-full bg-color-buy text-[#07090c] font-bold py-3.5 px-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-color-buy/20 shadow-lg"
            >
              {status === "LOADING" ? "Awaiting Signature..." : "Sign Challenge"}
            </button>
          </div>
        ) : status === "AUTHENTICATED" || (status === "LOADING" && (twitterHandle || isXLinked)) ? (
          <div className="flex flex-col items-center gap-6 w-full mt-4">
            <div className="text-center w-full">
              <p className="text-white font-semibold text-lg mb-1">Step 3: Market Details</p>
              <p className="text-color-muted text-sm mb-4">
                {isXLinked ? "Identity verified. Configure your market." : "Click below to authenticate your X (Twitter) account."}
              </p>

              {isXLinked && (
                <div className="w-full bg-white/10 border border-white/30 rounded-xl p-4 flex items-center justify-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                  <span className="font-bold text-white">@{twitterHandle}</span>
                  <span className="bg-color-buy text-[#07090c] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">VERIFIED</span>
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
              <div className="w-full flex flex-col gap-4 text-left">
                <div>
                  <label className="text-white text-sm font-semibold mb-1 block">Ticker *</label>
                  <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} placeholder={`e.g. $${twitterHandle?.toUpperCase()}`} className="w-full bg-[#07090c] border border-color-border rounded-lg p-3 text-white focus:border-color-buy outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-white text-sm font-semibold mb-1 block">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="About your community..." className="w-full bg-[#07090c] border border-color-border rounded-lg p-3 text-white focus:border-color-buy outline-none transition-colors resize-none h-20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-semibold mb-1 block">Website</label>
                    <input type="text" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#07090c] border border-color-border rounded-lg p-3 text-white focus:border-color-buy outline-none transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="text-white text-sm font-semibold mb-1 block">Telegram</label>
                    <input type="text" value={telegramUrl} onChange={e => setTelegramUrl(e.target.value)} placeholder="https://t.me/..." className="w-full bg-[#07090c] border border-color-border rounded-lg p-3 text-white focus:border-color-buy outline-none transition-colors text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-white text-sm font-semibold mb-2 block">Banner Image</label>
                  
                  {/* Tabs */}
                  <div className="flex gap-2 mb-3 bg-[#161A22] p-1 rounded-lg w-fit border border-color-border">
                    <button
                      type="button"
                      onClick={() => setBannerInputType("upload")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${bannerInputType === "upload" ? "bg-[#07090c] text-white shadow" : "text-color-muted hover:text-white"}`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerInputType("url")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${bannerInputType === "url" ? "bg-[#07090c] text-white shadow" : "text-color-muted hover:text-white"}`}
                    >
                      Paste URL
                    </button>
                  </div>

                  {bannerInputType === "upload" ? (
                    <div className="flex flex-col gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden" 
                        id="banner-upload"
                      />
                      <label 
                        htmlFor="banner-upload" 
                        className={`cursor-pointer bg-[#161A22] border ${uploadError ? 'border-red-500 text-red-400' : 'border-color-border text-white hover:border-color-buy'} rounded-lg px-4 py-3 flex flex-col items-center justify-center transition-colors text-sm font-semibold border-dashed w-full ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {isUploading ? (
                          <span>Uploading...</span>
                        ) : bannerUrl && bannerUrl.includes('supabase.co') ? (
                          <div className="flex flex-col items-center gap-1 text-color-buy">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              <span>Image uploaded successfully!</span>
                            </div>
                            {uploadedFileName && <span className="text-xs opacity-80 break-all text-center px-2">{uploadedFileName}</span>}
                            <span className="text-xs text-color-muted mt-1">Click to change</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-5 h-5 text-color-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            <span>Click to upload image</span>
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={bannerUrl} 
                      onChange={e => {
                        setBannerUrl(e.target.value);
                        if (uploadError) setUploadError(null);
                      }} 
                      placeholder="https://..." 
                      className={`w-full bg-[#07090c] border ${uploadError ? 'border-red-500 focus:border-red-400' : 'border-color-border focus:border-color-buy'} rounded-lg p-3 text-white outline-none transition-colors text-sm`}
                    />
                  )}
                  
                  {uploadError && (
                    <p className="text-red-500 text-xs mt-2">{uploadError}</p>
                  )}
                </div>
                <div>
                  <label className="text-white text-sm font-semibold mb-1 block">Initial Buy (Keys)</label>
                  <input type="number" min="0" value={initialBuyAmount} onChange={e => setInitialBuyAmount(e.target.value)} placeholder="0" className="w-full bg-[#07090c] border border-color-border rounded-lg p-3 text-white focus:border-color-buy outline-none transition-colors" />
                  <p className="text-color-muted text-xs mt-1">Optional. Buy keys in the same transaction to prevent snipers.</p>
                </div>
                
                <button
                  onClick={handleCreateMarket}
                  disabled={status === "LOADING" || !ticker.trim()}
                  className="w-full bg-[#1DA1F2] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#1DA1F2]/20 mt-2"
                >
                  {status === "LOADING" ? "Creating Market..." : "Launch Market"}
                </button>
              </div>
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
