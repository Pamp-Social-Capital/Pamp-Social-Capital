import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

import { db, creatorMarkets } from "@social-capital/db";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { PumpSocialCapitalSDK } from "@social-capital/sdk";

async function main() {
  const pda = "H2T3XiN9dugKzmQDWscsq9Sa5BpXweeoPhndkdFu4zdM";
  const rpcUrl = process.env.SOLANA_RPC_URL as string;
  const connection = new Connection(rpcUrl);
  const dummyWallet = new Wallet(Keypair.generate());
  const sdk = new PumpSocialCapitalSDK(connection, dummyWallet);
  
  const marketState = await sdk.program.account.creatorMarket.fetch(new PublicKey(pda));
  const handleBytes = Buffer.from(marketState.creatorId).filter((b: number) => b !== 0);
  const twitterHandle = Buffer.from(handleBytes).toString('utf-8');
  
  const userRecord = await db.query.users.findFirst({
    where: (users, { sql }) => sql`lower(${users.username}) = lower(${twitterHandle})`
  });
  
  const creatorWalletStr = marketState.creatorWallet.toString();
  
  await db.insert(creatorMarkets).values({
    marketPda: pda,
    twitterHandle: twitterHandle,
    creatorIdHex: Buffer.from(marketState.creatorId).toString('hex'),
    creatorWallet: creatorWalletStr,
    avatarUrl: userRecord?.avatarUrl || null,
    supply: marketState.supply.toNumber(),
    reserveLamports: marketState.reserveLamports.toNumber(),
    totalVolumeLamports: "0",
    claimed: marketState.claimed,
  }).onConflictDoUpdate({
    target: creatorMarkets.twitterHandle,
    set: {
      marketPda: pda,
      creatorIdHex: Buffer.from(marketState.creatorId).toString('hex'),
      creatorWallet: creatorWalletStr,
      claimed: marketState.claimed,
      avatarUrl: userRecord?.avatarUrl || null,
      supply: marketState.supply.toNumber(),
      reserveLamports: marketState.reserveLamports.toNumber(),
    }
  });
  console.log("Insert successful");
}
main().catch(console.error);
