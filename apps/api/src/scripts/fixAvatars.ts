import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../../../../.env") });
import { db, creatorMarkets, users } from "@social-capital/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Fixing avatars in creator_markets...");
  const markets = await db.select().from(creatorMarkets);
  let updated = 0;
  for (const m of markets) {
    if (!m.avatarUrl) {
      const u = await db.query.users.findFirst({
        where: eq(users.walletAddress, m.creatorWallet)
      });
      if (u && u.avatarUrl) {
        await db.update(creatorMarkets)
          .set({ avatarUrl: u.avatarUrl })
          .where(eq(creatorMarkets.id, m.id));
        updated++;
        console.log(`Updated avatar for market ${m.twitterHandle}`);
      }
    }
  }
  console.log(`Done. Updated ${updated} markets.`);
  process.exit(0);
}

main().catch(console.error);
