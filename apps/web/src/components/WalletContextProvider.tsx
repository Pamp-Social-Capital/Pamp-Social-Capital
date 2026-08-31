"use client";

import "../polyfills";

import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Use env var, but convert to absolute URL if it is a relative path like /api/rpc
  const endpoint = useMemo(() => {
    let rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
      throw new Error("NEXT_PUBLIC_RPC_URL environment variable is missing");
    }
    // Convert relative proxy path to absolute URL dynamically to prevent port conflicts (3000 vs 3001 vs 3002)
    if (rpcUrl.startsWith('/')) {
      if (typeof window !== 'undefined') {
        rpcUrl = `${window.location.origin}${rpcUrl}`;
      } else {
        // Fallback for Server-Side Rendering (SSR)
        const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || `http://localhost:${process.env.PORT || 3000}`;
        rpcUrl = `${baseUrl}${rpcUrl}`;
      }
    }
    return rpcUrl;
  }, []);

  const wsEndpoint = useMemo(() => {
    const wsUrl = process.env.NEXT_PUBLIC_RPC_WS_URL;
    if (!wsUrl) {
      throw new Error("NEXT_PUBLIC_RPC_WS_URL environment variable is missing");
    }
    return wsUrl;
  }, []);

  // In standard wallet adapter, many wallets are now auto-detected via wallet-standard.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ 
      wsEndpoint, // Pulled cleanly from env variable to avoid hardcoding devnet
      commitment: "confirmed" 
    }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
