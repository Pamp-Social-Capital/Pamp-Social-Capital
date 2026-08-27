import Fastify from 'fastify';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the root .env file if it exists
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const fastify = Fastify({
  logger: true
});

import { processHeliusWebhook } from './webhook';

// A simple health check
fastify.get('/', async (request, reply) => {
  return { status: 'ok', service: 'indexer' };
});

// The Helius webhook endpoint
fastify.post('/webhook/helius', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    
    // Verify Helius API Key
    if (process.env.HELIUS_API_KEY && authHeader !== process.env.HELIUS_API_KEY) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const payload = request.body as any[];
    fastify.log.info(`Received webhook payload with ${payload?.length || 0} items`);

    // Process transactions
    if (Array.isArray(payload) && payload.length > 0) {
      await processHeliusWebhook(fastify, payload);
    }

    reply.status(200).send({ status: 'success' });
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

const start = async () => {
  try {
    // Railway usually sets PORT
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
