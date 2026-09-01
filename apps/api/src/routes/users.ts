import { FastifyInstance } from "fastify";
import { db, creatorMarkets, feeWithdrawals, users } from "@social-capital/db";
import { desc, eq, and, sum } from "drizzle-orm";

export const usersRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/:address/markets", async (request, reply) => {
    try {
      const { address } = request.params as { address: string };
      const network = (request.query as any).network || "devnet";

      if (!address) {
        return reply.status(400).send({ success: false, error: "Address is required" });
      }

      // Fetch user profile from the users table
      const userProfile = await db.query.users.findFirst({
        where: eq(users.walletAddress, address),
      });

      // Fetch all markets created/owned by this wallet
      const markets = await db.query.creatorMarkets.findMany({
        where: and(
          eq(creatorMarkets.network, network),
          eq(creatorMarkets.creatorWallet, address)
        ),
        orderBy: [desc(creatorMarkets.createdAt)],
      });

      // Fetch total withdrawn fees for this user
      const totalFeesResult = await db
        .select({ total: sum(feeWithdrawals.amount) })
        .from(feeWithdrawals)
        .where(
          and(
            eq(feeWithdrawals.network, network),
            eq(feeWithdrawals.creatorWallet, address)
          )
        );
        
      const totalFeesLamports = totalFeesResult[0]?.total ? Number(totalFeesResult[0].total) : 0;
      
      // Fetch recent withdrawal history
      const withdrawals = await db.query.feeWithdrawals.findMany({
        where: and(
          eq(feeWithdrawals.network, network),
          eq(feeWithdrawals.creatorWallet, address)
        ),
        orderBy: [desc(feeWithdrawals.timestamp)],
        limit: 10,
      });

      return reply.send({
        success: true,
        userProfile,
        markets,
        stats: {
          totalFeesWithdrawn: totalFeesLamports / 1e9 // Convert to SOL
        },
        withdrawals
      });
    } catch (e: any) {
      console.error("Error fetching user markets:", e);
      return reply.status(500).send({ success: false, error: e.message || "Failed to fetch user markets" });
    }
  });
}
