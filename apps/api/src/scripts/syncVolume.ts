import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../../../../.env") });
import { db, creatorMarkets, tradeHistory } from "@social-capital/db";
import { eq, sql } from "drizzle-orm";

async function main() {
  console.log("Checking markets and trade history...");
  
  const markets = await db.select().from(creatorMarkets);
  console.log(`Found ${markets.length} markets.`);
  
  for (const m of markets) {
    console.log(`\nMarket: ${m.twitterHandle} (${m.marketPda})`);
    console.log(`Current DB Reserve: ${m.reserveLamports}`);
    console.log(`Current DB Volume: ${m.totalVolumeLamports}`);
    
    const trades = await db.select().from(tradeHistory).where(eq(tradeHistory.marketPda, m.marketPda));
    console.log(`Found ${trades.length} trades in history for this market.`);
    
    let calcVolume = 0n;
    
    for (const t of trades) {
      calcVolume += BigInt(t.lamports);
    }
    
    console.log(`Calculated Volume from trades: ${calcVolume.toString()}`);
    
    if (trades.length > 0 && calcVolume.toString() !== m.totalVolumeLamports) {
      console.log(`Mismatch! Updating volume to ${calcVolume.toString()}`);
      await db.update(creatorMarkets)
        .set({ totalVolumeLamports: calcVolume.toString() })
        .where(eq(creatorMarkets.marketPda, m.marketPda));
      console.log(`Updated volume for ${m.twitterHandle}`);
    }
  }
  
  console.log("\nDone checking and syncing.");
  process.exit(0);
}

main().catch(console.error);
