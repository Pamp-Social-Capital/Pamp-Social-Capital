import "../polyfills";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { PumpSocialCapitalSDK } from "@social-capital/sdk";

export function useSocialCapital() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const sdk = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null;
    
    // We cast to anchor.Wallet structure which SDK expects
    const anchorWallet = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    };
    
    return new PumpSocialCapitalSDK(connection, anchorWallet as any);
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  return sdk;
}
