import "../polyfills";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { PumpSocialCapitalSDK } from "@social-capital/sdk";
import { Keypair } from "@solana/web3.js";

export function useSocialCapital() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const sdk = useMemo(() => {
    const anchorWallet = (wallet.publicKey && wallet.signTransaction && wallet.signAllTransactions) ? {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    } : {
      publicKey: Keypair.generate().publicKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };
    
    return new PumpSocialCapitalSDK(connection, anchorWallet as any);
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  return sdk;
}
