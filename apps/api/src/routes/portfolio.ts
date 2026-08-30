import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db, userPositions, creatorMarkets, tradeHistory } from "@social-capital/db";
import { eq, inArray } from "drizzle-orm";

const K_CONSTANT = 100_000n; // 0.0001 SOL in lamports

export const portfolioRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/:wallet", async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    
    if (!wallet) {
      return reply.status(400).send({ success: false, error: "Wallet address is required" });
    }

    try {
      const positions = await db.query.userPositions.findMany({
        where: eq(userPositions.walletAddress, wallet),
      });

      if (positions.length === 0) {
        return reply.send({ success: true, portfolio: [] });
      }

      const marketPdas = positions.map(p => p.marketPda);
      const markets = await db.query.creatorMarkets.findMany({
        where: inArray(creatorMarkets.marketPda, marketPdas)
      });

      const marketMap = new Map();
      markets.forEach(m => marketMap.set(m.marketPda, m));

      const portfolio = positions.map(pos => {
        const market = marketMap.get(pos.marketPda);
        const supply = BigInt(market ? market.supply : 0);
        
        // Spot Price = K_CONSTANT * supply^2
        const spotPrice = K_CONSTANT * (supply ** 2n);
        
        const keyBalance = BigInt(pos.keyBalance);
        const totalBought = BigInt(pos.totalBoughtLamports);
        const totalSold = BigInt(pos.totalSoldLamports);
        
        const currentValue = keyBalance * spotPrice;
        const pnl = currentValue + totalSold - totalBought;

        return {
          ...pos,
          currentValueLamports: currentValue.toString(),
          pnlLamports: pnl.toString(),
          marketDetails: market
        };
      });
      
      return reply.send({ success: true, portfolio });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch portfolio" });
    }
  });

  fastify.get("/:wallet/trades", async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    
    if (!wallet) {
      return reply.status(400).send({ success: false, error: "Wallet address is required" });
    }

    try {
      const trades = await db.query.tradeHistory.findMany({
        where: eq(tradeHistory.traderWallet, wallet),
        orderBy: (tradeHistory, { desc }) => [desc(tradeHistory.timestamp)],
      });
      
      if (trades.length === 0) {
        return reply.send({ success: true, trades: [] });
      }

      const marketPdas = [...new Set(trades.map(t => t.marketPda))];
      const markets = await db.query.creatorMarkets.findMany({
        where: inArray(creatorMarkets.marketPda, marketPdas)
      });
      
      const marketMap = new Map();
      markets.forEach(m => marketMap.set(m.marketPda, m));
      
      const tradesWithMarket = trades.map(t => ({
        ...t,
        marketDetails: marketMap.get(t.marketPda) || null
      }));

      return reply.send({ success: true, trades: tradesWithMarket });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch user trades" });
    }
  });
};
