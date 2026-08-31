import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db, creatorMarkets } from "@social-capital/db";
import { sql, desc, eq } from "drizzle-orm";

export const marketRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/", async (request, reply) => {
    try {
      const markets = await db.query.creatorMarkets.findMany({
        where: eq(creatorMarkets.isActive, true),
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
        where: (tradeHistory, { eq }) => eq(tradeHistory.marketPda, pda),
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
        where: (feeWithdrawals, { eq }) => eq(feeWithdrawals.marketPda, pda),
        orderBy: (feeWithdrawals, { desc }) => [desc(feeWithdrawals.timestamp)],
      });
      
      return reply.send({ success: true, withdrawals });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch withdrawals" });
    }
  });

  fastify.get("/:pda/analytics", async (request, reply) => {
    try {
      const { pda } = request.params as { pda: string };
      
      const market = await db.query.creatorMarkets.findFirst({
        where: (creatorMarkets, { eq }) => eq(creatorMarkets.marketPda, pda),
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
      
      // Try to find the user in DB by twitterHandle (case-insensitive)
      const userRecord = await db.query.users.findFirst({
        where: (users, { sql }) => sql`lower(${users.username}) = lower(${twitterHandle})`
      });

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
      }).onConflictDoNothing();
      
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
        where: (creatorMarkets, { sql }) => sql`lower(${creatorMarkets.twitterHandle}) = lower(${handle})`
      });
      return reply.send({ exists: !!market });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to check handle" });
    }
  });
};
