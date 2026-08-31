import { db, users, creatorMarkets } from "@social-capital/db";

async function main() {
  const allUsers = await db.select().from(users);
  console.log("USERS:", JSON.stringify(allUsers, null, 2));

  const allMarkets = await db.select().from(creatorMarkets);
  console.log("MARKETS:", JSON.stringify(allMarkets, null, 2));
}

main().catch(console.error);
