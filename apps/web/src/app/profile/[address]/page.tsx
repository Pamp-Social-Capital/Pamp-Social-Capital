"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useWallet } from "@solana/wallet-adapter-react";
import { UserTradeHistoryComponent } from "@/components/UserTradeHistory";
import { UserWithdrawalHistoryComponent } from "@/components/UserWithdrawalHistory";
import { Tabs } from "@/components/Tabs";
import bs58 from "bs58";

interface PageProps {
  params: Promise<{ address: string }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage({ params }: PageProps) {
  const { address } = use(params);
  
  const getAvatarStyle = (seed: string) => {
    const styles = ["adventurer", "big-ears", "bottts", "bottts-neutral", "critters", "pixel-art", "voxel-art", "voxel-bot"];
    let hash = 0;
    for (let i = 0; i < Math.min(seed.length, 5); i++) hash += seed.charCodeAt(i);
    return styles[hash % styles.length];
  };

  const { publicKey, signMessage } = useWallet();
  const isOwner = publicKey?.toBase58() === address;
  
  const [activeTab, setActiveTab] = useState<"keys" | "trades" | "withdrawals">("keys");
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  
  const { data, error, isLoading: profileLoading, mutate: mutateProfile } = useSWR(
    `${API_URL}/api/users/${address}/markets?network=${network}`, 
    fetcher
  );

  const { data: portfolioData, isLoading: portfolioLoading } = useSWR(
    `${API_URL}/api/portfolio/${address}?network=${network}`,
    fetcher
  );

  const isLoading = profileLoading || portfolioLoading;

  const markets = data?.markets || [];
  const success = data?.success;
  const userProfile = data?.userProfile;
  const stats = data?.stats || { totalFeesWithdrawn: 0 };
  const withdrawals = data?.withdrawals || [];

  const positions = portfolioData?.portfolio || [];
  const totalFeesLamports = portfolioData?.totalFeesLamports ? BigInt(portfolioData.totalFeesLamports) : BigInt(0);

  // Calculate aggregates
  const totalValueLamports = positions.reduce((acc: bigint, pos: any) => acc + BigInt(pos.currentValueLamports), BigInt(0));
  const totalValueSol = (Number(totalValueLamports) / 1e9).toFixed(2);
  
  const totalPnLLamports = positions.reduce((acc: bigint, pos: any) => acc + BigInt(pos.pnlLamports), BigInt(0));
  const totalPnLSol = (Number(totalPnLLamports) / 1e9).toFixed(2);
  
  const totalKeys = positions.reduce((acc: number, pos: any) => acc + pos.keyBalance, 0);

  const totalFeesSol = (Number(totalFeesLamports) / 1e9).toFixed(2);
  const netProfitLamports = totalPnLLamports + totalFeesLamports;
  const netProfitSol = (Number(netProfitLamports) / 1e9).toFixed(2);

  const handleEditOpen = () => {
    setEditUsername(userProfile?.username || "");
    setEditBio(userProfile?.bio || "");
    setEditAvatarPreview(userProfile?.avatarUrl || null);
    setEditAvatarFile(null);
    setErrorMsg("");
    setIsEditing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("File is too large. Max 5MB.");
        return;
      }
      setEditAvatarFile(file);
      setEditAvatarPreview(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleSaveProfile = async () => {
    if (editBio && editBio.length > 160) {
      setErrorMsg("Bio cannot exceed 160 characters.");
      return;
    }
    
    setIsSaving(true);
    setErrorMsg("");
    
    try {
      let finalAvatarUrl = userProfile?.avatarUrl;

      if (editAvatarFile) {
        const { supabase } = await import("../../../lib/supabase");
        const fileExt = editAvatarFile.name.split('.').pop();
        const fileName = `${address}-${Date.now()}.${fileExt}`;
        
        const { error: uploadErr } = await supabase.storage
          .from('banners')
          .upload(fileName, editAvatarFile);

        if (uploadErr) {
          throw new Error("Failed to upload avatar: " + uploadErr.message);
        }

        const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
        finalAvatarUrl = data.publicUrl;
      }

      let token = localStorage.getItem('walletToken');
      
      if (!token) {
        if (!signMessage || !publicKey) throw new Error("Wallet not connected or does not support signing");
        setErrorMsg("Authenticating wallet...");
        
        // 1. Get Challenge
        const challengeRes = await fetch(`${API_URL}/api/auth/challenge?wallet=${publicKey.toBase58()}`);
        const challengeData = await challengeRes.json();
        if (!challengeData.success) throw new Error("Failed to get authentication challenge");
        
        setErrorMsg("Please sign the message in your wallet...");
        const messageUint8 = new TextEncoder().encode(challengeData.message);
        const signature = await signMessage(messageUint8);
        
        // 2. Verify
        const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: publicKey.toBase58(),
            message: challengeData.message,
            signature: bs58.encode(signature)
          })
        });
        
        const verifyData = await verifyRes.json();
        if (!verifyData.success) throw new Error(verifyData.error || "Failed to verify signature");
        
        token = verifyData.token;
        localStorage.setItem("walletToken", token!);
        setErrorMsg(""); // clear loading message
      }

      const response = await fetch(`${API_URL}/api/users/${address}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editUsername,
          bio: editBio,
          avatarUrl: finalAvatarUrl
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      await mutateProfile();
      setSuccessMsg("Profile updated successfully!");
      setIsEditing(false);
      
      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col items-center gap-4 bg-[#12141A] p-8 rounded-2xl border border-color-border/50 shadow-lg">
          <div className="w-24 h-24 rounded-full bg-white/5"></div>
          <div className="h-6 w-48 bg-white/5 rounded"></div>
          <div className="h-4 w-32 bg-white/5 rounded"></div>
        </div>
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#12141A] rounded-2xl border border-color-border/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || (data && !success)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold text-red-400 mb-2">Error Loading Profile</h1>
        <p className="text-color-muted">Failed to fetch creator history.</p>
      </div>
    );
  }

  // Show Empty State for non-existent profiles that have no activity, UNLESS they are the owner looking at their own profile
  if (!isLoading && !userProfile && markets.length === 0 && positions.length === 0 && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-[#12141A] rounded-2xl border border-color-border/50">
        <svg className="w-16 h-16 text-color-muted mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
        <p className="text-color-muted max-w-md">This wallet has not registered a profile and has no market activity.</p>
        <Link href="/" className="mt-6 px-6 py-2 bg-color-buy text-[#07090c] font-bold rounded-lg hover:opacity-90 transition-opacity">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-emerald-900/20 to-[#12141A] p-10 rounded-2xl border border-color-border/50 shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-color-buy to-emerald-500 opacity-70" />
        
        <div className="w-28 h-28 rounded-full overflow-hidden bg-[#161A22] border-4 border-color-buy/30 shadow-xl">
          <img 
            src={userProfile?.avatarUrl || `https://api.dicebear.com/7.x/${getAvatarStyle(address)}/svg?seed=${address}`} 
            alt="Creator Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {userProfile?.username || "Creator"}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-mono text-sm text-color-muted">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
            <button
              onClick={() => navigator.clipboard.writeText(address)}
              title="Copy Address"
              className="p-1.5 bg-[#161A22] border border-color-border/50 rounded-lg text-color-muted hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
          </div>
          {userProfile?.createdAt && (
            <p className="text-color-muted text-xs mt-1">
              Joined {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
          
          {userProfile?.bio && (
            <p className="text-white text-sm mt-3 max-w-md mx-auto">{userProfile.bio}</p>
          )}
          
          {isOwner && (
            <div className="mt-4">
              <button 
                onClick={handleEditOpen}
                className="bg-[#161A22] border border-color-border/50 text-white text-sm font-medium px-4 py-2 rounded-lg hover:border-color-buy/50 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

      </div>
      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="bg-[#12141A] p-6 rounded-2xl border border-color-border/50 shadow-lg relative overflow-hidden xl:col-span-1">
             <div className="text-color-muted text-sm mb-1">Portfolio Value</div>
             <div className="text-3xl font-bold text-white">{totalValueSol} <span className="text-sm font-normal text-color-muted">SOL</span></div>
          </div>
          <div className="bg-[#12141A] p-6 rounded-2xl border border-color-border/50 shadow-lg xl:col-span-1">
             <div className="text-color-muted text-sm mb-1">Keys Held</div>
             <div className="text-3xl font-bold text-white">{totalKeys}</div>
          </div>
          <div className="bg-[#12141A] p-6 rounded-2xl border border-color-border/50 shadow-lg xl:col-span-1">
             <div className="text-color-muted text-sm mb-1">Trading PnL</div>
             <div className={`text-3xl font-bold ${totalPnLLamports >= 0 ? 'text-color-buy' : 'text-color-sell'}`}>
                {totalPnLLamports >= 0 ? '+' : ''}{totalPnLSol} SOL
             </div>
          </div>
          <div className="bg-[#12141A] p-6 rounded-2xl border border-color-border/50 shadow-lg xl:col-span-1">
             <div className="text-color-muted text-sm mb-1">Creator Fees</div>
             <div className="text-3xl font-bold text-blue-400">
                +{totalFeesSol} SOL
             </div>
          </div>
          <div className="bg-[#12141A] p-6 rounded-2xl border border-color-border/50 shadow-lg xl:col-span-1 relative overflow-hidden">
             <div className="text-color-muted text-sm mb-1">Total Net Profit</div>
             <div className={`text-3xl font-bold ${netProfitLamports >= 0 ? 'text-color-buy' : 'text-color-sell'}`}>
                {netProfitLamports >= 0 ? '+' : ''}{netProfitSol} <span className="text-sm font-normal text-color-muted">SOL</span>
             </div>
          </div>
      </div>

      {/* Market History */}
      <div className="w-full mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Market History</h2>
          <span className="bg-[#161A22] border border-color-border px-3 py-1 rounded-full text-white text-sm">
            <span className="text-color-muted mr-1">Total Launched:</span> {markets.length}
          </span>
        </div>
        
        {markets.length === 0 ? (
          <div className="bg-[#12141A] border border-color-border/50 rounded-2xl p-10 text-center">
            <p className="text-color-muted">This address has not launched any markets yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {markets.map((market: any) => (
              <div key={market.marketPda} className="bg-[#12141A] border border-color-border/50 rounded-2xl overflow-hidden shadow-lg hover:border-indigo-500/50 transition-colors group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#161A22] border border-color-border overflow-hidden shrink-0">
                        {market.avatarUrl ? (
                          <img src={market.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold bg-indigo-600">
                            {market.twitterHandle.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white truncate max-w-[150px]">@{market.twitterHandle}</h3>
                        <p className="text-sm text-color-muted truncate max-w-[150px]">{market.ticker || market.twitterHandle}</p>
                      </div>
                    </div>
                    
                    {market.claimed ? (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        Claimed
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                        Unclaimed
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-color-muted">Market PDA</span>
                      <span className="text-white font-mono">{market.marketPda.slice(0,4)}...{market.marketPda.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-color-muted">Date</span>
                      <span className="text-white">{new Date(market.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/creator/${market.marketPda}`}
                    className="block w-full text-center bg-[#161A22] hover:bg-indigo-600 border border-color-border hover:border-indigo-500 text-white font-medium py-2 rounded-xl transition-all"
                  >
                    View Market
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'keys', label: 'Your Keys' },
          { id: 'trades', label: 'Trade History' },
          { id: 'withdrawals', label: 'Withdrawal History' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        className="mt-8 mb-6"
      />

      {activeTab === 'keys' && (
        <section className="bg-[#12141A] border border-color-border/50 p-6 rounded-2xl shadow-lg">
          {positions.length === 0 ? (
             <div className="text-center py-12 text-color-muted">You do not own any creator keys yet. <br/><Link href="/" className="text-color-buy hover:underline mt-2 inline-block">Explore Markets</Link></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-color-muted border-b border-color-border">
                    <th className="pb-4 font-medium">Creator PDA</th>
                    <th className="pb-4 font-medium">Balance (Keys)</th>
                    <th className="pb-4 font-medium">Total Value (SOL)</th>
                    <th className="pb-4 font-medium">PnL (SOL)</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {positions.map((pos: any, i: number) => {
                    const valSol = (Number(pos.currentValueLamports) / 1e9).toFixed(4);
                    const pnlSol = (Number(pos.pnlLamports) / 1e9).toFixed(4);
                    const isPositive = Number(pos.pnlLamports) >= 0;
                    const shortMarket = `${pos.marketPda.substring(0,8)}...`;
                    const marketName = pos.marketDetails?.twitterHandle || "Unknown Creator";
                    
                    return (
                      <tr key={i} className="border-b border-color-border/50 hover:bg-white/5 transition-colors">
                        <td className="py-4 font-semibold hover:underline">
                          <Link href={`/creator/${pos.marketPda}`} className="flex flex-col">
                            <span className="text-white text-base">{marketName}</span>
                            <span className="text-color-buy text-xs font-normal mt-0.5">{shortMarket}</span>
                          </Link>
                        </td>
                        <td className="py-4">{pos.keyBalance}</td>
                        <td className="py-4 font-medium">{valSol}</td>
                        <td className={`py-4 font-semibold ${isPositive ? 'text-color-buy' : 'text-color-sell'}`}>
                          {isPositive ? '+' : ''}{pnlSol}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'trades' && (
        <UserTradeHistoryComponent address={address} />
      )}

      {activeTab === 'withdrawals' && (
        <div className="w-full">
          {withdrawals.length === 0 ? (
            <div className="bg-[#12141A] border border-color-border/50 rounded-2xl p-6 text-center">
              <p className="text-color-muted text-sm">No withdrawals yet.</p>
            </div>
          ) : (
            <div className="bg-[#12141A] border border-color-border/50 rounded-2xl overflow-hidden shadow-lg">
              <div className="divide-y divide-color-border">
                {withdrawals.map((w: any) => (
                  <div key={w.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <div className="font-bold text-emerald-400">
                        +{(w.amount / 1e9).toFixed(4)} SOL
                      </div>
                      <div className="text-xs text-color-muted mt-1">
                        {new Date(w.timestamp).toLocaleDateString()} {new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <a 
                      href={`https://solscan.io/tx/${w.signature}?cluster=${network}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-[#161A22] rounded-lg border border-color-border text-color-muted hover:text-white transition-colors"
                      title="View on Explorer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {successMsg && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-[#1FC782]/20 border border-[#1FC782]/50 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
          <svg className="w-5 h-5 text-[#1FC782]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#12141A] border border-color-border/50 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Edit Profile</h2>
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-color-muted text-sm mb-1">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#161A22] border-2 border-color-buy/30">
                    <img 
                      src={editAvatarPreview || `https://api.dicebear.com/7.x/${getAvatarStyle(address)}/svg?seed=${address}`} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm bg-[#161A22] border border-color-border/50 text-white rounded hover:border-color-buy/50 transition-colors"
                  >
                    Upload Image
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-color-muted text-sm mb-1">Username</label>
                <input 
                  type="text" 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[#161A22] border border-color-border/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-color-buy/50"
                  placeholder="Enter username"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-color-muted text-sm mb-1">Bio</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#161A22] border border-color-border/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-color-buy/50 resize-none h-24"
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                />
                <div className="text-right text-xs text-color-muted mt-1">
                  {editBio.length}/160
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-color-muted hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-color-buy text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
