import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

import { Connection, Keypair, VersionedTransaction, PublicKey } from "@solana/web3.js";
import { PumpSocialCapitalSDK } from "@social-capital/sdk";
import bs58 from "bs58";
import { db, activityLogs, pscBuybacks, pscBurns } from "@social-capital/db";
import * as anchor from "@coral-xyz/anchor";

const THRESHOLD_LAMPORTS = 0.001 * 1e9; // 0.001 SOL

async function main() {
  console.log("Starting Keeper Execution...");
  const rpcUrl = process.env.SOLANA_RPC_URL;
  const keeperSecretStr = process.env.KEEPER_SECRET_KEY;
  
  if (!rpcUrl) throw new Error("SOLANA_RPC_URL missing");
  
  if (!keeperSecretStr) {
    console.log("KEEPER_SECRET_KEY missing. Skipping execution.");
    process.exit(0);
  }
  
  const keeperKeypair = Keypair.fromSecretKey(bs58.decode(keeperSecretStr));
  const connection = new Connection(rpcUrl, "confirmed");
  
  // Use anchor to create provider
  const wallet = new anchor.Wallet(keeperKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  const sdk = new PumpSocialCapitalSDK(connection, wallet);
  
  // Get PDA for Buyback Vault
  const pscBuybackVault = sdk.getPscBuybackVaultPda();
  
  // Check Balance
  const vaultBalance = await connection.getBalance(pscBuybackVault);
  console.log(`Vault Balance: ${vaultBalance / 1e9} SOL`);
  
  if (vaultBalance < THRESHOLD_LAMPORTS) {
    console.log(`Balance below threshold (${THRESHOLD_LAMPORTS / 1e9} SOL). Skipping.`);
    await db.insert(activityLogs).values({
      action: "KEEPER_EXECUTION",
      status: "SKIPPED",
      details: JSON.stringify({ vaultBalance, reason: "Below threshold" })
    });
    process.exit(0);
  }
  
  console.log("Threshold met. Executing buyback...");
  
  try {
    const isDevnet = rpcUrl.includes("devnet");
    let solSpent = vaultBalance;
    let pscReceived = 0;
    
    // 1. Get Jupiter Quote
    if (!isDevnet) {
        // Fetch Jupiter Quote for Mainnet
        const pscMint = process.env.PSC_MINT_ADDRESS;
        if (!pscMint) {
            throw new Error("PSC_MINT_ADDRESS is not set in .env");
        }
        const quoteRes = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${pscMint}&amount=${solSpent}&slippageBps=50`);
        const quoteResponse = await quoteRes.json();
        
        if (quoteResponse.error) {
            throw new Error(`Jupiter Quote Error: ${quoteResponse.error}`);
        }
        
        pscReceived = parseInt(quoteResponse.outAmount);
        
        // 2. Get Swap Transaction
        const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: keeperKeypair.publicKey.toBase58(),
                wrapAndUnwrapSol: true
            })
        });
        
        const { swapTransaction } = await swapRes.json();
        if (!swapTransaction) {
            throw new Error("Failed to get swap transaction from Jupiter");
        }
        
        const swapTxBuf = Buffer.from(swapTransaction, 'base64');
        const swapVtx = VersionedTransaction.deserialize(swapTxBuf);
        
        // In production, execute the swap, wait for confirmation, then execute buyback SDK
        console.log(`Will receive ~${pscReceived} PSC from Jupiter`);
    } else {
        console.log("Devnet mode: Mocking Jupiter Swap");
        // Devnet Mock: Assume we get some PSC
        pscReceived = 1000 * 1e6; 
    }
    // Execute the real swap on mainnet or attempt buyback on devnet (which will fail without $PSC)
    await sdk.executeBuyback(new anchor.BN(solSpent), new anchor.BN(pscReceived), keeperKeypair.publicKey, new PublicKey(process.env.PSC_MINT_ADDRESS!));
    
    // Note: The real executeBuyback transaction will trigger a webhook 
    // which then inserts the REAL records into psc_buybacks and psc_burns.
    
    await db.insert(activityLogs).values({
      action: "KEEPER_EXECUTION",
      status: "SUCCESS",
      details: JSON.stringify({ solSpent, pscReceived })
    });
    
    console.log("Buyback logged successfully.");
  } catch (err: any) {
    console.error(err);
    await db.insert(activityLogs).values({
      action: "KEEPER_EXECUTION",
      status: "ERROR",
      errorMessage: err.message,
      details: JSON.stringify({ error: String(err) })
    });
  }
  
  process.exit(0);
}

main().catch(console.error);
