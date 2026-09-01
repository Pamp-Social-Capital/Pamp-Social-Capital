import { FastifyInstance } from "fastify";
import { db, creatorMarkets } from "@social-capital/db";
import { desc, eq, and } from "drizzle-orm";

export const usersRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/:address/markets", async (request, reply) => {
    try {
      const { address } = request.params as { address: string };
      const network = (request.query as any).network || "devnet";

      if (!address) {
        return reply.status(400).send({ success: false, error: "Address is required" });
      }

      // Fetch all markets created/owned by this wallet
      const markets = await db.query.creatorMarkets.findMany({
        where: and(
          eq(creatorMarkets.network, network),
          eq(creatorMarkets.creatorWallet, address)
        ),
        orderBy: [desc(creatorMarkets.createdAt)],
      });

      return reply.send({
        success: true,
        markets: markets
      });
    } catch (e: any) {
      console.error("Error fetching user markets:", e);
      return reply.status(500).send({ success: false, error: e.message || "Failed to fetch user markets" });
    }
  });
}
