import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { PumpSocialCapitalSDK } from "@social-capital/sdk";
import { db, creatorMarkets, activityLogs } from "@social-capital/db";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// CONFIGURATION
// ==========================================
// In your .env file, you should have: CREATOR_SECRET_KEY=4YcAHj... (base58 string)
let parsedKey: Uint8Array;
try {
  if (!process.env.CREATOR_SECRET_KEY) {
    throw new Error("Missing CREATOR_SECRET_KEY");
  }
  // Decode the base58 string directly
  parsedKey = anchor.utils.bytes.bs58.decode(process.env.CREATOR_SECRET_KEY);
} catch (e) {
  console.error("❌ ERROR: CREATOR_SECRET_KEY format is invalid. It should be a base58 string from your Phantom wallet export.");
  process.exit(1);
}
const CREATOR_SECRET_KEY = parsedKey;

// This script is strictly for DEVNET to avoid accidental mainnet deployments
const NETWORK = "devnet";
// ==========================================

async function main() {
  if (CREATOR_SECRET_KEY.length === 0) {
    console.error("❌ ERROR: CREATOR_SECRET_KEY is empty. Please add CREATOR_SECRET_KEY=[your_byte_array] to your .env file.");
    process.exit(1);
  }

  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("SOLANA_RPC_URL environment variable is not set.");
  }

  if (!rpcUrl.includes("devnet")) {
    console.error(`❌ ERROR: This script is restricted to Devnet only! Your RPC URL looks like a mainnet URL: ${rpcUrl}`);
    process.exit(1);
  }

  const connection = new Connection(rpcUrl, "confirmed");
  const keypair = Keypair.fromSecretKey(CREATOR_SECRET_KEY);
  console.log(`Using Wallet: ${keypair.publicKey.toBase58()}`);

  const wallet = new anchor.Wallet(keypair);
  const sdk = new PumpSocialCapitalSDK(connection, wallet as any);

  // Load JSON
  const dummyUsersPath = path.join(__dirname, "../packages/db/dummy_users.json");
  const usersStr = fs.readFileSync(dummyUsersPath, "utf8");
  const users = JSON.parse(usersStr);

  console.log(`Loaded ${users.length} users to seed...`);

  for (const user of users) {
    console.log(`\n======================================`);
    console.log(`Processing @${user.username} (${user.name})`);

    try {
      const handle = user.username;
      
      // Convert handle to 32-byte array
      const creatorId = new Uint8Array(32);
      const handleBytes = Buffer.from(handle, 'utf-8');
      creatorId.set(handleBytes.subarray(0, Math.min(handleBytes.length, 32)));

      const marketPda = sdk.getCreatorMarketPda(creatorId);
      console.log(`Market PDA: ${marketPda.toBase58()}`);

      // Check if it exists in DB
      const existingMarket = await db.query.creatorMarkets.findFirst({
        where: and(
          eq(creatorMarkets.network, NETWORK),
          eq(creatorMarkets.marketPda, marketPda.toBase58())
        )
      });

      if (!existingMarket) {
        console.log(`Deploying market on-chain...`);
        try {
          const txSignature = await sdk.createCreatorMarket(Array.from(creatorId));
          console.log(`✓ Market created! Signature: ${txSignature}`);
        } catch (chainErr: any) {
          if (chainErr.message.includes("already in use")) {
            console.log(`Market already exists on-chain. Skipping creation.`);
          } else {
            throw chainErr;
          }
        }
      } else {
        console.log(`Market already exists in DB. Syncing metadata only.`);
      }

      const creatorIdHex = Buffer.from(creatorId).toString('hex');
      const ticker = handle.toUpperCase();

      // Upsert into Database to ensure rich metadata (banner, bio, etc.) is saved
      console.log(`Saving metadata to database...`);
      await db.insert(creatorMarkets).values({
        network: NETWORK,
        marketPda: marketPda.toBase58(),
        twitterHandle: handle,
        twitterName: user.name,
        creatorIdHex: creatorIdHex,
        creatorWallet: keypair.publicKey.toBase58(),
        avatarUrl: user.avatar || null,
        ticker: user.ticker || handle.toUpperCase(),
        description: user.description || `Official Creator Key for ${user.name}`,
        bannerUrl: user.bannerUrl || null,
        category: user.category || "Influencer",
        websiteUrl: user.websiteUrl || null,
        telegramUrl: user.telegramUrl || null,
        supply: 0,
        reserveLamports: 0,
        totalVolumeLamports: "0",
        isActive: true
      }).onConflictDoUpdate({
        target: creatorMarkets.marketPda,
        set: {
          twitterName: user.name,
          avatarUrl: user.avatar || null,
          ticker: user.ticker || handle.toUpperCase(),
          description: user.description || `Official Creator Key for ${user.name}`,
          bannerUrl: user.bannerUrl || null,
          category: user.category || "Influencer",
          websiteUrl: user.websiteUrl || null,
          telegramUrl: user.telegramUrl || null
        }
      });
      console.log(`✓ Database updated for @${handle}`);

      // Delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err: any) {
      console.error(`✗ Failed to process @${user.username}: ${err.message}`);
    }
  }

  console.log(`\n======================================`);
  console.log(`Seeding complete!`);
  process.exit(0);
}

main().catch(console.error);
