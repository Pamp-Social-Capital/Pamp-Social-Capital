import { Connection, PublicKey } from "@solana/web3.js";
import { PumpSocialCapitalSDK } from "../packages/sdk/dist/index.js";
import { db, creatorMarkets } from "../packages/db/src/index.ts";
import * as anchor from "@coral-xyz/anchor";

async function sync() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  // A dummy wallet is enough to fetch accounts
  const dummyWallet = new anchor.Wallet(anchor.web3.Keypair.generate());
  const sdk = new PumpSocialCapitalSDK(connection, dummyWallet as any);

  console.log("Fetching markets from Devnet...");
  const markets = await sdk.program.account.creatorMarket.all();
  console.log(`Found ${markets.length} markets on-chain.`);

  for (const m of markets) {
    const pda = m.publicKey.toBase58();
    const data = m.account;
    
    const creatorIdArray = data.creatorId;
    const creatorIdHex = Buffer.from(creatorIdArray).toString('hex');
    const handleBytes = Buffer.from(creatorIdArray).filter((b: number) => b !== 0);
    const twitterHandle = Buffer.from(handleBytes).toString('utf-8');

    console.log(`Syncing ${twitterHandle} (${pda})...`);
    
    await db.insert(creatorMarkets).values({
      marketPda: pda,
      twitterHandle: twitterHandle,
      creatorIdHex: creatorIdHex,
      creatorWallet: data.creatorWallet.toBase58(),
      supply: data.supply.toNumber(),
      reserveLamports: data.reserveLamports.toNumber(),
      totalVolumeLamports: data.totalVolumeLamports.toString()
    }).onConflictDoNothing();
  }
  console.log("Done syncing!");
}

sync().catch(console.error);
