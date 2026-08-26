import { BorshInstructionCoder, Program, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { IDL } from "@social-capital/sdk/dist/idl/social_capital";
import { db, tradeHistory, creatorMarkets, userPositions, priceCandles } from "@social-capital/db";
import { eq, sql } from "drizzle-orm";
import { createHash } from "crypto";
import bs58 from "bs58";
import { realtimeEmitter } from "./services/emitter";

const PROGRAM_ID = new PublicKey(IDL.address);

const patchedIdl = JSON.parse(JSON.stringify(IDL));
for (const ix of patchedIdl.instructions) {
  ix.discriminator = Array.from(createHash('sha256').update('global:' + ix.name).digest().slice(0, 8));
}
const coder = new BorshInstructionCoder(patchedIdl as any);

async function processTradeForCandles(marketPda: string, price: number, volume: number) {
  const resolutions = [
    { name: "1m", ms: 60 * 1000 },
    { name: "5m", ms: 5 * 60 * 1000 },
    { name: "15m", ms: 15 * 60 * 1000 },
    { name: "1h", ms: 60 * 60 * 1000 },
    { name: "1d", ms: 24 * 60 * 60 * 1000 },
  ];

  const now = Date.now();

  for (const res of resolutions) {
    const roundedTimestamp = new Date(now - (now % res.ms));
    
    await db.insert(priceCandles).values({
      marketPda,
      resolution: res.name,
      timestamp: roundedTimestamp,
      open: price,
      high: price,
      low: price,
      close: price,
      volumeLamports: volume,
    }).onConflictDoUpdate({
      target: [priceCandles.marketPda, priceCandles.resolution, priceCandles.timestamp],
      set: {
        high: sql`GREATEST(${priceCandles.high}, ${price})`,
        low: sql`LEAST(${priceCandles.low}, ${price})`,
        close: price,
        volumeLamports: sql`${priceCandles.volumeLamports} + ${volume}`,
      }
    });

    realtimeEmitter.emit("candle_update", {
      marketPda,
      resolution: res.name,
      timestamp: roundedTimestamp,
      close: price
    });
  }
}

export async function processHeliusPayload(transactions: any[]) {
  for (const tx of transactions) {
    if (tx.transactionError) {
      console.log(`Skipping failed tx: ${tx.signature}`);
      continue;
    }

    // Find instructions for our program
    const ourInstructions = tx.instructions?.filter(
      (ix: any) => ix.programId === PROGRAM_ID.toBase58()
    );

    if (!ourInstructions || ourInstructions.length === 0) continue;

    for (const ix of ourInstructions) {
      try {
        // Helius returns bs58 encoded data
        const dataBuffer = Buffer.from(bs58.decode(ix.data));
        const decoded = coder.decode(dataBuffer, "base58");
        
        if (!decoded) continue;

        if (decoded.name === "createCreatorMarket") {
          const data = decoded.data as any;
          // data.creatorId is a number array of 32 bytes
          const creatorIdArray = data.creatorId;
          const creatorIdHex = Buffer.from(creatorIdArray).toString('hex');
          
          // To get twitter handle, strip trailing zeros
          const handleBytes = Buffer.from(creatorIdArray).filter(b => b !== 0);
          const twitterHandle = Buffer.from(handleBytes).toString('utf-8');
          
          const marketPda = ix.accounts[0]; // creatorMarket account
          const creatorWallet = tx.feePayer; // assuming payer is the creator for now
          
          await db.insert(creatorMarkets).values({
            marketPda: marketPda,
            twitterHandle: twitterHandle,
            creatorIdHex: creatorIdHex,
            creatorWallet: creatorWallet,
            supply: 0,
            reserveLamports: 0,
            totalVolumeLamports: "0"
          }).onConflictDoNothing();
          
          console.log(`Indexed new market: ${twitterHandle} (${marketPda})`);
        } else if (decoded.name === "buyKeys") {
          const data = decoded.data as any;
          const amount = data.amount as BN;
          const maxSolCost = data.maxSolCost as BN;
          
          const marketPda = ix.accounts[0]; // Assuming creatorMarket is the first account
          const userPositionPda = ix.accounts[1];
          const buyer = tx.feePayer;
          
          // In a real production app, we would calculate exact lamports spent from nativeTransfers
          // Here we just use a placeholder 0 for lamports to show the schema working
          await db.insert(tradeHistory).values({
            signature: tx.signature,
            marketPda: marketPda,
            traderWallet: buyer,
            tradeType: "buy",
            amount: amount.toNumber(),
            lamports: maxSolCost.toNumber(), // Simplification
            feeLamports: 0,
          }).onConflictDoNothing();

          // Update user position (upsert)
          // Note: using sql`` for atomic increments in production is better, but here we simplify
          await db.insert(userPositions).values({
            walletAddress: buyer,
            marketPda: marketPda,
            positionPda: userPositionPda,
            keyBalance: amount.toNumber(),
            totalBoughtLamports: maxSolCost.toString(),
            totalSoldLamports: "0"
          }).onConflictDoUpdate({
            target: userPositions.positionPda,
            set: {
              keyBalance: sql`${userPositions.keyBalance} + ${amount.toNumber()}`,
            }
          });

          // Update creator market
          await db.update(creatorMarkets)
            .set({
              supply: sql`${creatorMarkets.supply} + ${amount.toNumber()}`,
              // Volume would be incremented here
            })
            .where(eq(creatorMarkets.marketPda, marketPda));

          const price = amount.toNumber() > 0 ? Math.floor(maxSolCost.toNumber() / amount.toNumber()) : 0;
          await processTradeForCandles(marketPda, price, maxSolCost.toNumber());
          
          realtimeEmitter.emit("trade", {
            marketPda,
            traderWallet: buyer,
            tradeType: "buy",
            amount: amount.toNumber(),
            lamports: maxSolCost.toNumber(),
            timestamp: Date.now()
          });

        } else if (decoded.name === "sellKeys") {
          const data = decoded.data as any;
          const amount = data.amount as BN;
          const minSolOutput = data.minSolOutput as BN;
          
          const marketPda = ix.accounts[0];
          const userPositionPda = ix.accounts[1];
          const seller = tx.feePayer;
          
          await db.insert(tradeHistory).values({
            signature: tx.signature,
            marketPda: marketPda,
            traderWallet: seller,
            tradeType: "sell",
            amount: amount.toNumber(),
            lamports: minSolOutput.toNumber(), // Simplification
            feeLamports: 0,
          }).onConflictDoNothing();

          // Update user position
          await db.insert(userPositions).values({
            walletAddress: seller,
            marketPda: marketPda,
            positionPda: userPositionPda,
            keyBalance: 0, // Should already exist before sell
            totalBoughtLamports: "0",
            totalSoldLamports: minSolOutput.toString()
          }).onConflictDoUpdate({
            target: userPositions.positionPda,
            set: {
              keyBalance: sql`${userPositions.keyBalance} - ${amount.toNumber()}`
            }
          });
          
          // Update creator market
          await db.update(creatorMarkets)
            .set({
              supply: sql`${creatorMarkets.supply} - ${amount.toNumber()}`,
            })
            .where(eq(creatorMarkets.marketPda, marketPda));
            
          const price = amount.toNumber() > 0 ? Math.floor(minSolOutput.toNumber() / amount.toNumber()) : 0;
          await processTradeForCandles(marketPda, price, minSolOutput.toNumber());
          
          realtimeEmitter.emit("trade", {
            marketPda,
            traderWallet: seller,
            tradeType: "sell",
            amount: amount.toNumber(),
            lamports: minSolOutput.toNumber(),
            timestamp: Date.now()
          });
        }
      } catch (e) {
        console.error(`Error decoding instruction for tx ${tx.signature}:`, e);
      }
    }
  }
}
