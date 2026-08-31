import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db, userPositions, creatorMarkets, tradeHistory } from "@social-capital/db";
import { eq, inArray, and } from "drizzle-orm";
const network = process.env.SOLANA_NETWORK || "devnet";

const K_CONSTANT = 100_000n; // 0.0001 SOL in lamports

export const portfolioRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/:wallet", async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    
    if (!wallet) {
      return reply.status(400).send({ success: false, error: "Wallet address is required" });
    }

    try {
      const positions = await db.query.userPositions.findMany({
        where: and(eq(userPositions.network, network), eq(userPositions.walletAddress, wallet)),
      });

      if (positions.length === 0) {
        return reply.send({ success: true, portfolio: [] });
      }

      const marketPdas = positions.map(p => p.marketPda);
      const markets = await db.query.creatorMarkets.findMany({
        where: and(eq(creatorMarkets.network, network), inArray(creatorMarkets.marketPda, marketPdas))
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
      
      const { feeWithdrawals } = await import("@social-capital/db");
      const withdrawals = await db.query.feeWithdrawals.findMany({
        where: and(eq(feeWithdrawals.network, network), eq(feeWithdrawals.creatorWallet, wallet)),
      });
      const totalFeesLamports = withdrawals.reduce((acc, w) => acc + BigInt(w.amount), BigInt(0));
      
      return reply.send({ 
        success: true, 
        portfolio, 
        totalFeesLamports: totalFeesLamports.toString() 
      });
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
        where: and(eq(tradeHistory.network, network), eq(tradeHistory.traderWallet, wallet)),
        orderBy: (tradeHistory, { desc }) => [desc(tradeHistory.timestamp)],
      });
      
      if (trades.length === 0) {
        return reply.send({ success: true, trades: [] });
      }

      const marketPdas = [...new Set(trades.map(t => t.marketPda))];
      const markets = await db.query.creatorMarkets.findMany({
        where: and(eq(creatorMarkets.network, network), inArray(creatorMarkets.marketPda, marketPdas))
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

  fastify.get("/:wallet/withdrawals", async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    
    if (!wallet) {
      return reply.status(400).send({ success: false, error: "Wallet address is required" });
    }

    try {
      const { feeWithdrawals } = await import("@social-capital/db");
      
      const withdrawals = await db.query.feeWithdrawals.findMany({
        where: and(eq(feeWithdrawals.network, network), eq(feeWithdrawals.creatorWallet, wallet)),
        orderBy: (feeWithdrawals, { desc }) => [desc(feeWithdrawals.timestamp)],
      });
      
      if (withdrawals.length === 0) {
        return reply.send({ success: true, withdrawals: [] });
      }

      const marketPdas = [...new Set(withdrawals.map(w => w.marketPda))];
      const markets = await db.query.creatorMarkets.findMany({
        where: and(eq(creatorMarkets.network, network), inArray(creatorMarkets.marketPda, marketPdas))
      });
      
      const marketMap = new Map();
      markets.forEach(m => marketMap.set(m.marketPda, m));
      
      const withdrawalsWithMarket = withdrawals.map(w => ({
        ...w,
        marketDetails: marketMap.get(w.marketPda) || null
      }));

      return reply.send({ success: true, withdrawals: withdrawalsWithMarket });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch user withdrawals" });
    }
  });
};
