import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the root .env file if it exists
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is missing in environment variables!");
  process.exit(1);
}

// Disable prefetch as it is not supported for pooled connections
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
