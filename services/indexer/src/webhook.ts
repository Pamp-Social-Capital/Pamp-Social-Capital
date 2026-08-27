import { FastifyInstance } from 'fastify';
import { db } from './db';
import { markets, trades } from './db/schema';
import { eq } from 'drizzle-orm';
import { Connection, PublicKey } from '@solana/web3.js';
import { PumpSocialCapitalSDK } from '@social-capital/sdk';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import BN from 'bn.js';

// Setup SDK
const rpcUrl = process.env.SOLANA_RPC_URL;
if (!rpcUrl) {
  throw new Error("SOLANA_RPC_URL is missing in environment variables!");
}
const connection = new Connection(rpcUrl);
const dummyWallet = new Wallet(Keypair.generate());
const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });
const sdk = new PumpSocialCapitalSDK(connection, dummyWallet);

export async function processHeliusWebhook(fastify: FastifyInstance, payload: any[]) {
  // We need to parse program events from the transactions
  for (const tx of payload) {
    fastify.log.info(`Parsing transaction ${tx.signature}`);
    
    // We can fetch the transaction from RPC using the sdk or we can parse the webhook payload
    // Helius webhooks provide instruction data in the payload, but Anchor events are logged in the transaction logs.
    // If the webhook payload has events, we process them, otherwise we fetch the tx from RPC to get the logs.
    
    // Simplest way is to just fetch the tx from RPC to decode Anchor events
    try {
      const txInfo = await connection.getTransaction(tx.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });
      
      if (!txInfo || !txInfo.meta || !txInfo.meta.logMessages) continue;

      // Extract events from logs using the Anchor program
      // We can use the program's event parser
      const events: any[] = [];
      const eventParser = new (sdk as any).program.coder.events.EventParser((sdk as any).program.programId, (sdk as any).program.coder);
      
      for (const event of eventParser.parseLogs(txInfo.meta.logMessages)) {
        events.push(event);
      }

      for (const event of events) {
        if (event.name === 'MarketCreated') {
          const { creatorId, marketPda, creatorHandle } = event.data;
          
          await db.insert(markets).values({
            creatorId: Buffer.from(creatorId).toString('hex'), // Or handle base58 depending on how it's stored
            marketPda: marketPda.toString(),
            creatorHandle: creatorHandle || '',
            supply: '0',
            reserve: '0',
            marketCap: '0'
          }).onConflictDoNothing();
          fastify.log.info(`Inserted MarketCreated for ${marketPda.toString()}`);
        }
        
        else if (event.name === 'KeysBought' || event.name === 'KeysSold') {
          const { market, buyer, seller, keyAmount, solAmount, creatorFee, protocolFee, supply, reserve } = event.data;
          const userWallet = buyer ? buyer.toString() : seller.toString();
          const tradeType = event.name === 'KeysBought' ? 'buy' : 'sell';
          
          const feeAmount = new BN(creatorFee).add(new BN(protocolFee)).toString();

          // Insert Trade
          await db.insert(trades).values({
            signature: tx.signature,
            marketPda: market.toString(),
            tradeType,
            userWallet,
            keyAmount: keyAmount.toString(),
            solAmount: solAmount.toString(),
            feeAmount,
            timestamp: new Date()
          }).onConflictDoNothing();
          
          // Update Market Supply and Reserve
          await db.update(markets).set({
            supply: supply.toString(),
            reserve: reserve.toString(),
            updatedAt: new Date()
          }).where(eq(markets.marketPda, market.toString()));
          
          fastify.log.info(`Inserted ${tradeType} trade for ${market.toString()} by ${userWallet}`);
        }
      }

    } catch (e) {
      fastify.log.error(e, `Failed to process tx ${tx.signature}:`);
    }
  }
}
