import Fastify from "fastify";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { db, activityLogs } from "@social-capital/db";
import fastifyWebsocket from "@fastify/websocket";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import { processHeliusPayload } from "./indexer";
import { authRoutes } from "./routes/auth";
import { marketRoutes } from "./routes/markets";
import { oauthRoutes } from "./routes/oauth";
import { portfolioRoutes } from "./routes/portfolio";
import { protocolRoutes } from "./routes/protocol";
import { websocketRoutes } from "./routes/websocket";
import { usersRoutes } from "./routes/users";

dotenv.config({ path: resolve(__dirname, "../../../.env") });

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyCors, {
  origin: "*", // Adjust for production
});

fastify.register(fastifyRateLimit, {
  max: 100, // default limit 100 requests per windowMs
  timeWindow: '1 minute'
});

fastify.register(fastifyWebsocket);

fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(oauthRoutes, { prefix: "/api/oauth" });
fastify.register(marketRoutes, { prefix: "/api/markets" });
fastify.register(portfolioRoutes, { prefix: "/api/portfolio" });
fastify.register(protocolRoutes, { prefix: "/api/protocol" });
fastify.register(usersRoutes, { prefix: "/api/users" });
fastify.register(websocketRoutes, { prefix: "/ws" });

fastify.post("/webhook/helius", async (request, reply) => {
  try {
    const authHeader = request.headers["authorization"];
    
    // Verify Helius Auth Header
    if (authHeader !== process.env.HELIUS_API_KEY) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const payload = request.body as any[];
    
    // Log the payload to the database
    try {
      await db.insert(activityLogs).values({
        action: 'WEBHOOK_RECEIVED',
        details: JSON.stringify(payload),
        status: 'SUCCESS'
      });
    } catch (dbErr) {
      fastify.log.error(dbErr, "Failed to log webhook to db");
    }
    
    fastify.log.info(`Received Helius webhook payload: ${payload.length} transactions`);
    
    // Process and insert to database
    await processHeliusPayload(payload);

    return reply.status(200).send({ success: true });
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});

fastify.post("/webhook/sync-tx", async (request, reply) => {
  try {
    const { signature } = request.body as { signature: string };
    if (!signature) {
      return reply.status(400).send({ error: "Missing signature" });
    }
    
    fastify.log.info(`Manual sync requested for tx: ${signature}`);
    await processHeliusPayload([{ signature }]);
    
    return reply.status(200).send({ success: true });
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});

const start = async () => {
  try {
    if (!process.env.PORT) throw new Error("PORT is required");
    const port = parseInt(process.env.PORT);
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
