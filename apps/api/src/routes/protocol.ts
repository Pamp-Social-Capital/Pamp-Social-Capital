import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db, protocolFees, pscBuybacks, pscBurns } from "@social-capital/db";
import { sum } from "drizzle-orm";

export const protocolRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/stats", async (request, reply) => {
    try {
      // Aggregate Protocol Fees
      const feeResult = await db.select({
        totalFees: sum(protocolFees.amount)
      }).from(protocolFees);

      // Aggregate Buybacks
      const buybackResult = await db.select({
        totalSolSpent: sum(pscBuybacks.solSpent),
        totalPscReceived: sum(pscBuybacks.pscReceived)
      }).from(pscBuybacks);

      // Aggregate Burns
      const burnResult = await db.select({
        totalPscBurned: sum(pscBurns.amount)
      }).from(pscBurns);

      return reply.send({
        success: true,
        stats: {
          totalProtocolFeesLamports: feeResult[0]?.totalFees || 0,
          totalBuybackSolSpentLamports: buybackResult[0]?.totalSolSpent || 0,
          totalPscBought: buybackResult[0]?.totalPscReceived || 0,
          totalPscBurned: burnResult[0]?.totalPscBurned || 0,
        }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: "Failed to fetch protocol stats" });
    }
  });
};
