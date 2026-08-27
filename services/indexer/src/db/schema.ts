import { pgTable, text, timestamp, numeric, serial } from 'drizzle-orm/pg-core';

export const markets = pgTable('markets', {
  id: serial('id').primaryKey(),
  creatorId: text('creator_id').notNull().unique(), // The 32-byte creator ID (pubkey or string)
  marketPda: text('market_pda').notNull().unique(),
  creatorHandle: text('creator_handle'),
  supply: numeric('supply').notNull().default('0'), // String numeric to hold BN
  reserve: numeric('reserve').notNull().default('0'), // SOL reserve in lamports
  marketCap: numeric('market_cap').notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  signature: text('signature').notNull().unique(),
  marketPda: text('market_pda').notNull(), // References markets.marketPda
  tradeType: text('trade_type').notNull(), // 'buy' or 'sell'
  userWallet: text('user_wallet').notNull(), // Pubkey of buyer/seller
  keyAmount: numeric('key_amount').notNull(), // Keys transacted
  solAmount: numeric('sol_amount').notNull(), // SOL spent or received
  feeAmount: numeric('fee_amount').notNull(), // Fees paid
  timestamp: timestamp('timestamp').notNull(),
});
