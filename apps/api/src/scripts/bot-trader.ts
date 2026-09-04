import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { PumpSocialCapitalSDK } from "@social-capital/sdk";
import { db, creatorMarkets } from "@social-capital/db";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// CONFIGURATION
// ==========================================
const NETWORK = "devnet";
const MIN_KEYS = 1;
const MAX_KEYS = 20;
const TRADE_INTERVAL_MS = 15000; // 15 seconds

// Helper: Get a random integer between min and max (inclusive)
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function startBotTrader() {
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl || !rpcUrl.includes("devnet")) {
    console.warn(`⚠️ WARNING: Bot trader restricted to Devnet only! Aborting.`);
    return;
  }

  const secretKeyString = process.env.CREATOR_SECRET_KEY;
  if (!secretKeyString) {
    console.warn("⚠️ WARNING: Missing CREATOR_SECRET_KEY in .env. Bot trader aborting.");
    return;
  }

  let parsedKey: Uint8Array;
  try {
    parsedKey = anchor.utils.bytes.bs58.decode(secretKeyString);
  } catch (e) {
    console.warn("⚠️ WARNING: Secret key format is invalid. It should be a base58 string. Bot trader aborting.");
    return;
  }

  const connection = new Connection(rpcUrl, "confirmed");
  const keypair = Keypair.fromSecretKey(parsedKey);
  console.log(`🤖 Bot Trader Initialized`);
  console.log(`💳 Wallet: ${keypair.publicKey.toBase58()}`);
  
  const wallet = new anchor.Wallet(keypair);
  const sdk = new PumpSocialCapitalSDK(connection, wallet as any);

  // Infinite trading loop
  while (true) {
    try {
      // Fetch all deployed markets from DB (do this every loop to get new markets too)
      const markets = await db.query.creatorMarkets.findMany({
        where: eq(creatorMarkets.network, NETWORK)
      });

      if (markets.length === 0) {
        console.log("⏳ Bot Trader: No markets found in DB for devnet. Waiting...");
        await sleep(TRADE_INTERVAL_MS);
        continue;
      }

      // Pick a random market
      const randomMarket = markets[Math.floor(Math.random() * markets.length)];
      const creatorIdHex = randomMarket.creatorIdHex;
      const creatorId = new Uint8Array(Buffer.from(creatorIdHex, 'hex'));
      
      // Decide amount to trade
      const amount = getRandomInt(MIN_KEYS, MAX_KEYS);
      const amountBN = new anchor.BN(amount);

      // Check current position to decide BUY or SELL
      let keysOwned = 0;
      try {
        const position = await sdk.getUserPosition(creatorId, keypair.publicKey);
        keysOwned = position.keysOwned.toNumber();
      } catch (err) {
        // Position account might not exist yet (owns 0 keys)
        keysOwned = 0;
      }

      // If we don't own any keys, we MUST buy. Otherwise, 50/50 chance to buy or sell.
      const isBuy = keysOwned === 0 ? true : Math.random() > 0.5;

      console.log(`\n🤖 [Bot Trader] ==============================`);
      console.log(`🎯 Target: @${randomMarket.twitterHandle} (${randomMarket.ticker})`);

      if (isBuy) {
        console.log(`🛒 Action: BUY ${amount} keys`);
        // Max SOL cost - arbitrarily high for bot testing (e.g. 5 SOL)
        const maxSolCost = new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL); 
        const signature = await sdk.buyKeys(creatorId, amountBN, maxSolCost);
        console.log(`✅ BUY Success! Tx: ${signature}`);
      } else {
        // Can only sell up to what we own
        const sellAmount = Math.min(amount, keysOwned);
        const sellAmountBN = new anchor.BN(sellAmount);
        console.log(`💸 Action: SELL ${sellAmount} keys (Owned: ${keysOwned})`);
        
        // Min SOL output - 0 for bot testing
        const minSolOutput = new anchor.BN(0);
        const signature = await sdk.sellKeys(creatorId, sellAmountBN, minSolOutput);
        console.log(`✅ SELL Success! Tx: ${signature}`);
      }

    } catch (error: any) {
      console.error(`❌ [Bot Trader] Trade Failed: ${error.message}`);
    }

    console.log(`⏳ [Bot Trader] Waiting ${TRADE_INTERVAL_MS / 1000} seconds before next trade...`);
    await sleep(TRADE_INTERVAL_MS);
  }
}
