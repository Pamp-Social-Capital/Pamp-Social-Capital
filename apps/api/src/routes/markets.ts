import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db, creatorMarkets } from "@social-capital/db";
import { sql, desc, eq, and } from "drizzle-orm";

const network = process.env.SOLANA_NETWORK || "devnet";

export const marketRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/", async (request, reply) => {
    try {
      const markets = await db.query.creatorMarkets.findMany({
        where: and(eq(creatorMarkets.network, network), eq(creatorMarkets.isActive, true)),
        orderBy: [desc(creatorMarkets.createdAt)],
        limit: 50,
      });
      const pdas = markets.map(m => m.marketPda);
      
      let holderCounts: Record<string, number> = {};
      let sparklines: Record<string, number[]> = {};
      
      if (pdas.length > 0) {
        const inClause = sql.join(pdas.map(p => sql`${p}`), sql`, `);
        
        // Fetch holder counts
        const counts = await db.execute(sql`
          SELECT market_pda, COUNT(DISTINCT wallet_address) as count
          FROM user_positions
          WHERE market_pda IN (${inClause}) AND key_balance > 0
          GROUP BY market_pda
        `);
        for (const row of counts) {
          holderCounts[row.market_pda as string] = Number(row.count);
        }

        // Fetch sparklines (last 20 candles of 1h resolution per market)
        const recentCandles = await db.execute(sql`
          SELECT market_pda, close, timestamp
          FROM (
            SELECT market_pda, close, timestamp,
                   ROW_NUMBER() OVER (PARTITION BY market_pda ORDER BY timestamp DESC) as rn
            FROM price_candles
            WHERE market_pda IN (${inClause}) AND resolution = '1h'
          ) sub
          WHERE rn <= 20
          ORDER BY timestamp ASC
        `);
        for (const row of recentCandles) {
          const pda = row.market_pda as string;
          if (!sparklines[pda]) sparklines[pda] = [];
          sparklines[pda].push(Number(row.close) / 1e9);
        }
      }

      const marketsWithHolders = markets.map(m => ({
        ...m,
        holderCount: holderCounts[m.marketPda] || 0,
        sparkline: sparklines[m.marketPda] || []
      }));

      return reply.send({ success: true, markets: marketsWithHolders });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch markets" });
    }
  });

  fastify.get("/trending", async (request, reply) => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await db.execute(sql`
        SELECT 
          t.market_pda AS "marketPda",
          SUM(t.lamports) AS volume_lamports,
          COUNT(DISTINCT t.trader_wallet) AS unique_traders
        FROM trade_history t
        JOIN creator_markets m ON t.market_pda = m.market_pda
        WHERE t.timestamp >= ${oneDayAgo} AND m.is_active = true
        GROUP BY t.market_pda
        ORDER BY volume_lamports DESC
        LIMIT 20
      `);
      
      return reply.send({ success: true, trending: result }); 
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch trending markets" });
    }
  });
  fastify.get("/:pda/candles", async (request, reply) => {
    try {
      const { pda } = request.params as { pda: string };
      const query = request.query as { resolution?: string };
      const resolution = query.resolution || "1m";
      
      const candles = await db.query.priceCandles.findMany({
        where: (priceCandles, { eq, and }) => and(
          eq(priceCandles.network, network),
          eq(priceCandles.marketPda, pda),
          eq(priceCandles.resolution, resolution)
        ),
        orderBy: (priceCandles, { desc }) => [desc(priceCandles.timestamp)],
        limit: 100, // Fetch the last 100 candles
      });
      
      // Sort in chronological order for charting (oldest first)
      const sortedCandles = candles.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      return reply.send({ success: true, candles: sortedCandles });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch candles" });
    }
  });

  fastify.get("/:pda/trades", async (request, reply) => {
    try {
      const { pda } = request.params as { pda: string };
      
      // Fetch all trades for the market
      const trades = await db.query.tradeHistory.findMany({
        where: (tradeHistory, { eq, and }) => and(eq(tradeHistory.network, network), eq(tradeHistory.marketPda, pda)),
        orderBy: (tradeHistory, { desc }) => [desc(tradeHistory.timestamp)],
      });
      
      return reply.send({ success: true, trades });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch trades" });
    }
  });

  fastify.get("/:pda/withdrawals", async (request, reply) => {
    try {
      const { pda } = request.params as { pda: string };
      
      const withdrawals = await db.query.feeWithdrawals.findMany({
        where: (feeWithdrawals, { eq, and }) => and(eq(feeWithdrawals.network, network), eq(feeWithdrawals.marketPda, pda)),
        orderBy: (feeWithdrawals, { desc }) => [desc(feeWithdrawals.timestamp)],
      });
      
      return reply.send({ success: true, withdrawals });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch withdrawals" });
    }
  });

  // Dual-write fallback: frontend calls this after a successful on-chain withdrawal
  // to guarantee the record is saved even if the Helius webhook is delayed or missing.
  fastify.post("/:pda/record-withdrawal", async (request, reply) => {
    try {
      const { pda } = request.params as { pda: string };
      const { signature } = request.body as { signature: string };

      if (!signature) {
        return reply.status(400).send({ success: false, error: "Missing transaction signature" });
      }

      // Import dependencies
      const { feeWithdrawals, activityLogs } = await import("@social-capital/db");

      // Idempotency check: skip if already recorded (by webhook or previous call)
      const existing = await db.query.feeWithdrawals.findFirst({
        where: and(eq(feeWithdrawals.network, network), eq(feeWithdrawals.signature, signature))
      });

      if (existing) {
        return reply.send({ success: true, message: "Withdrawal already recorded", withdrawal: existing });
      }

      // Verify the transaction on-chain via RPC
      const { Connection } = await import("@solana/web3.js");
      const rpcUrl = process.env.SOLANA_RPC_URL as string;
      const connection = new Connection(rpcUrl, "confirmed");

      const txInfo = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
      });

      if (!txInfo) {
        return reply.status(404).send({ success: false, error: "Transaction not found on-chain. It may still be confirming, try again shortly." });
      }

      if (txInfo.meta?.err) {
        return reply.status(400).send({ success: false, error: "Transaction failed on-chain" });
      }

      // Parse the event from on-chain logs to extract amount and creatorWallet
      const { BorshCoder, EventParser } = await import("@coral-xyz/anchor");
      const { PublicKey } = await import("@solana/web3.js");
      const { IDL } = await import("@social-capital/sdk/dist/idl/social_capital");
      const { createHash } = await import("crypto");

      const PROGRAM_ID = new PublicKey(IDL.address);

      const patchedIdl = JSON.parse(JSON.stringify(IDL));
      for (const ix of patchedIdl.instructions) {
        ix.discriminator = Array.from(createHash('sha256').update('global:' + ix.name).digest().slice(0, 8));
      }
      for (const ev of patchedIdl.events) {
        ev.discriminator = Array.from(createHash('sha256').update('event:' + ev.name).digest().slice(0, 8));
      }
      const coder = new BorshCoder(patchedIdl as any);
      const eventParser = new EventParser(PROGRAM_ID, coder);

      let withdrawalAmount: number | null = null;
      let creatorWallet: string | null = null;
      let marketPdaFromEvent: string | null = null;

      if (txInfo.meta?.logMessages) {
        for (const event of eventParser.parseLogs(txInfo.meta.logMessages)) {
          if (event.name === "CreatorFeesWithdrawn") {
            const data = event.data as any;
            withdrawalAmount = Number(data.amount);
            creatorWallet = data.creatorWallet.toString();
            marketPdaFromEvent = data.creatorMarket.toString();
            break;
          }
        }
      }

      if (withdrawalAmount === null || !creatorWallet || !marketPdaFromEvent) {
        return reply.status(400).send({ success: false, error: "No CreatorFeesWithdrawn event found in this transaction" });
      }

      // Verify the event's market PDA matches the URL parameter
      if (marketPdaFromEvent !== pda) {
        return reply.status(400).send({ success: false, error: "Market PDA mismatch between URL and on-chain event" });
      }

      // Insert withdrawal record (onConflictDoNothing for extra safety)
      const [inserted] = await db.insert(feeWithdrawals).values({
        network,
        signature,
        marketPda: pda,
        creatorWallet,
        amount: withdrawalAmount
      }).onConflictDoNothing().returning();

      // Log activity
      await db.insert(activityLogs).values({
        network,
        action: 'FEE_WITHDRAWAL',
        walletAddress: creatorWallet,
        details: JSON.stringify({ marketPda: pda, amount: withdrawalAmount, signature, source: 'frontend_fallback' }),
        status: 'SUCCESS'
      });

      return reply.send({ success: true, message: "Withdrawal recorded", withdrawal: inserted || existing });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to record withdrawal" });
    }
  });

  fastify.get("/:pda/analytics", async (request, reply) => {
    try {
      const { pda } = request.params as { pda: string };
      
      const market = await db.query.creatorMarkets.findFirst({
        where: (creatorMarkets, { eq, and }) => and(eq(creatorMarkets.network, network), eq(creatorMarkets.marketPda, pda)),
      });

      if (!market) {
        return reply.status(404).send({ success: false, error: "Market not found" });
      }

      const holderCountResult = await db.execute(sql`
        SELECT COUNT(DISTINCT wallet_address) as count
        FROM user_positions
        WHERE market_pda = ${pda} AND key_balance > 0
      `);
      
      const holderCount = Number(holderCountResult[0]?.count || 0);

      return reply.send({ 
        success: true, 
        analytics: {
          totalVolumeLamports: market.totalVolumeLamports,
          holderCount
        }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch analytics" });
    }
  });

  fastify.post("/:pda/sync", async (request, reply) => {
    try {
      const { pda } = request.params as { pda: string };
      
      const { Connection, PublicKey, Keypair } = await import("@solana/web3.js");
      const { Wallet } = await import("@coral-xyz/anchor");
      const { PumpSocialCapitalSDK } = await import("@social-capital/sdk");
      
      const rpcUrl = process.env.SOLANA_RPC_URL as string;
      const connection = new Connection(rpcUrl);
      const dummyWallet = new Wallet(Keypair.generate());
      const sdk = new PumpSocialCapitalSDK(connection, dummyWallet);
      
      const marketState = await sdk.program.account.creatorMarket.fetch(new PublicKey(pda));
      if (!marketState) return reply.status(404).send({ error: "Not found on chain" });

      const handleBytes = Buffer.from(marketState.creatorId).filter((b: number) => b !== 0);
      const twitterHandle = Buffer.from(handleBytes).toString('utf-8');
      
      const creatorWalletStr = marketState.creatorWallet.toString();
      
      // Twitter profile metadata (name, avatar) can now be passed from the frontend.
      const body = request.body as { ticker?: string, websiteUrl?: string, telegramUrl?: string, description?: string, bannerUrl?: string, txSignature?: string, twitterName?: string, avatarUrl?: string } | undefined;

      await db.insert(creatorMarkets).values({
        marketPda: pda,
        twitterHandle: twitterHandle,
        twitterName: body?.twitterName || null,
        creatorIdHex: Buffer.from(marketState.creatorId).toString('hex'),
        creatorWallet: creatorWalletStr,
        avatarUrl: body?.avatarUrl || null,
        supply: marketState.supply.toNumber(),
        reserveLamports: marketState.reserveLamports.toNumber(),
        totalVolumeLamports: "0",
        claimed: marketState.claimed,
        ticker: body?.ticker || twitterHandle.toUpperCase(),
        websiteUrl: body?.websiteUrl || null,
        telegramUrl: body?.telegramUrl || null,
        description: body?.description || null,
        bannerUrl: body?.bannerUrl || null,
      }).onConflictDoUpdate({
        target: creatorMarkets.marketPda,
        set: {
          creatorWallet: creatorWalletStr,
          claimed: marketState.claimed,
          supply: marketState.supply.toNumber(),
          reserveLamports: marketState.reserveLamports.toNumber(),
          // Only update metadata if provided in the body
          ...(body?.ticker !== undefined ? { ticker: body.ticker } : {}),
          ...(body?.websiteUrl !== undefined ? { websiteUrl: body.websiteUrl } : {}),
          ...(body?.telegramUrl !== undefined ? { telegramUrl: body.telegramUrl } : {}),
          ...(body?.description !== undefined ? { description: body.description } : {}),
          ...(body?.bannerUrl !== undefined ? { bannerUrl: body.bannerUrl } : {}),
          ...(body?.txSignature !== undefined ? { txSignature: body.txSignature } : {}),
          ...(body?.twitterName !== undefined ? { twitterName: body.twitterName } : {}),
          ...(body?.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        }
      });
      
      return reply.send({ success: true, message: "Market synced" });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to sync market" });
    }
  });

  fastify.get("/check/:handle", async (request, reply) => {
    try {
      const { handle } = request.params as { handle: string };
      const market = await db.query.creatorMarkets.findFirst({
        where: (creatorMarkets, { sql, eq, and }) => and(eq(creatorMarkets.network, network), sql`lower(${creatorMarkets.twitterHandle}) = lower(${handle})`)
      });
      return reply.send({ exists: !!market });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to check handle" });
    }
  });
};
