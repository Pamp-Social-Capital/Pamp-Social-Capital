import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db, creatorMarkets } from "@social-capital/db";
import { sql, desc } from "drizzle-orm";

export const marketRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/", async (request, reply) => {
    try {
      const markets = await db.query.creatorMarkets.findMany({
        orderBy: [desc(creatorMarkets.createdAt)],
        limit: 50,
      });
      return reply.send({ success: true, markets });
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
          market_pda AS "marketPda",
          SUM(lamports) AS volume_lamports,
          COUNT(DISTINCT trader_wallet) AS unique_traders
        FROM trade_history
        WHERE timestamp >= ${oneDayAgo}
        GROUP BY market_pda
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
      // Default to 1m resolution for now
      const resolution = "1m";
      
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
};
