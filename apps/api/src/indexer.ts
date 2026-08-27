import { BorshCoder, Program, BN, EventParser } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
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
const coder = new BorshCoder(patchedIdl as any);

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
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) {
    console.error("SOLANA_RPC_URL is missing");
    return;
  }
  const connection = new Connection(rpcUrl, 'confirmed');
  const eventParser = new EventParser(PROGRAM_ID, coder);

  for (const tx of transactions) {
    if (tx.transactionError) {
      console.log(`Skipping failed tx: ${tx.signature}`);
      continue;
    }

    try {
      const txInfo = await connection.getTransaction(tx.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });
      
      if (!txInfo) {
        console.log(`[Warning] Transaction ${tx.signature} not found on RPC. Check if RPC Network matches Webhook Network.`);
        continue;
      }
      
      if (!txInfo.meta || !txInfo.meta.logMessages) {
        console.log(`[Warning] Transaction ${tx.signature} has no metadata or logs.`);
        continue;
      }

      const events: any[] = [];
      for (const event of eventParser.parseLogs(txInfo.meta.logMessages)) {
        events.push(event);
      }

      for (const event of events) {
        if (event.name === "MarketCreated") {
          const { creatorId, marketPda, creatorHandle } = event.data as any;
          const creatorIdArray = creatorId;
          const creatorIdHex = Buffer.from(creatorIdArray).toString('hex');
          
          const handleBytes = Buffer.from(creatorIdArray).filter((b: number) => b !== 0);
          const twitterHandle = Buffer.from(handleBytes).toString('utf-8');
          
          const creatorWallet = tx.feePayer || txInfo.transaction.message.staticAccountKeys[0].toString();
          
          await db.insert(creatorMarkets).values({
            marketPda: marketPda.toString(),
            twitterHandle: twitterHandle,
            creatorIdHex: creatorIdHex,
            creatorWallet: creatorWallet,
            supply: 0,
            reserveLamports: 0,
            totalVolumeLamports: "0",
            txSignature: tx.signature
          }).onConflictDoNothing();
          
          console.log(`Indexed new market: ${twitterHandle} (${marketPda.toString()})`);
          
        } else if (event.name === "KeysBought" || event.name === "KeysSold") {
          const data = event.data as any;
          const marketPda = data.market.toString();
          const userWallet = (data.buyer || data.seller).toString();
          const tradeType = event.name === "KeysBought" ? "buy" : "sell";
          
          const amount = (data.keyAmount as BN).toNumber();
          const lamports = (data.solAmount as BN).toNumber();
          const creatorFee = (data.creatorFee as BN).toNumber();
          const protocolFee = (data.protocolFee as BN).toNumber();
          const feeLamports = creatorFee + protocolFee;

          await db.insert(tradeHistory).values({
            signature: tx.signature,
            marketPda: marketPda,
            traderWallet: userWallet,
            tradeType: tradeType,
            amount: amount,
            lamports: lamports,
            feeLamports: feeLamports,
          }).onConflictDoNothing();

          const [positionPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("position"), data.market.toBuffer(), new PublicKey(userWallet).toBuffer()],
            PROGRAM_ID
          );

          if (tradeType === "buy") {
            await db.insert(userPositions).values({
              walletAddress: userWallet,
              marketPda: marketPda,
              positionPda: positionPda.toString(),
              keyBalance: amount,
              totalBoughtLamports: lamports.toString(),
              totalSoldLamports: "0"
            }).onConflictDoUpdate({
              target: userPositions.positionPda,
              set: {
                keyBalance: sql`${userPositions.keyBalance} + ${amount}`,
              }
            });

            await db.update(creatorMarkets)
              .set({ supply: sql`${creatorMarkets.supply} + ${amount}` })
              .where(eq(creatorMarkets.marketPda, marketPda));
          } else {
            await db.insert(userPositions).values({
              walletAddress: userWallet,
              marketPda: marketPda,
              positionPda: positionPda.toString(),
              keyBalance: 0,
              totalBoughtLamports: "0",
              totalSoldLamports: lamports.toString()
            }).onConflictDoUpdate({
              target: userPositions.positionPda,
              set: {
                keyBalance: sql`${userPositions.keyBalance} - ${amount}`,
              }
            });

            await db.update(creatorMarkets)
              .set({ supply: sql`${creatorMarkets.supply} - ${amount}` })
              .where(eq(creatorMarkets.marketPda, marketPda));
          }

          const price = amount > 0 ? Math.floor(lamports / amount) : 0;
          await processTradeForCandles(marketPda, price, lamports);
          
          realtimeEmitter.emit("trade", {
            marketPda,
            traderWallet: userWallet,
            tradeType,
            amount,
            lamports,
            timestamp: Date.now()
          });
          
          console.log(`Indexed ${tradeType} for ${amount} keys at ${marketPda}`);
        }
      }
    } catch (e) {
      console.error(`Error processing tx ${tx.signature}:`, e);
    }
  }
}
