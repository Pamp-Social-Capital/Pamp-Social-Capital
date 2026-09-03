import { pgTable, serial, text, timestamp, boolean, bigint, uuid, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").unique().notNull(),
  nonce: text("nonce"),
  username: text("username"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const creatorMarkets = pgTable("creator_markets", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  twitterHandle: text("twitter_handle").unique().notNull(), // The raw Twitter handle string
  twitterName: text("twitter_name"), // Display name from Twitter
  creatorIdHex: text("creator_id_hex").unique().notNull(), // The 32-byte zero-padded hex representation
  creatorWallet: text("creator_wallet").notNull(),
  marketPda: text("market_pda").unique().notNull(),
  ticker: text("ticker").notNull().default(""), // Ticker symbol
  websiteUrl: text("website_url"),
  telegramUrl: text("telegram_url"),
  description: text("description"),
  bannerUrl: text("banner_url"),
  category: text("category").default("Regular User"),
  avatarUrl: text("avatar_url"), // Cached avatar from Twitter
  supply: bigint("supply", { mode: "number" }).default(0).notNull(),
  reserveLamports: bigint("reserve_lamports", { mode: "number" }).default(0).notNull(),
  totalVolumeLamports: text("total_volume_lamports").default("0").notNull(), // Using text because u128 can be very large
  claimed: boolean("claimed").default(false).notNull(),
  paused: boolean("paused").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  txSignature: text("tx_signature"), // Transaction hash for market creation/claim
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPositions = pgTable("user_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  walletAddress: text("wallet_address").notNull(),
  marketPda: text("market_pda").notNull(),
  positionPda: text("position_pda").unique().notNull(),
  keyBalance: bigint("key_balance", { mode: "number" }).default(0).notNull(),
  totalBoughtLamports: text("total_bought_lamports").default("0").notNull(),
  totalSoldLamports: text("total_sold_lamports").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tradeHistory = pgTable("trade_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  signature: text("signature").unique().notNull(),
  marketPda: text("market_pda").notNull(),
  traderWallet: text("trader_wallet").notNull(),
  tradeType: text("trade_type").notNull(), // "buy" or "sell"
  amount: bigint("amount", { mode: "number" }).notNull(),
  lamports: bigint("lamports", { mode: "number" }).notNull(), // the amount of SOL paid or received
  feeLamports: bigint("fee_lamports", { mode: "number" }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const priceCandles = pgTable("price_candles", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  marketPda: text("market_pda").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  resolution: text("resolution").notNull(), // "1m", "5m", "15m", "1h", "1d"
  open: bigint("open", { mode: "number" }).notNull(),
  high: bigint("high", { mode: "number" }).notNull(),
  low: bigint("low", { mode: "number" }).notNull(),
  close: bigint("close", { mode: "number" }).notNull(),
  volumeLamports: bigint("volume_lamports", { mode: "number" }).default(0).notNull(),
}, (t) => ({
  unq: unique().on(t.marketPda, t.resolution, t.timestamp, t.network)
}));

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  action: text("action").notNull(), // 'WALLET_LOGIN', 'TWITTER_LINK', 'WEBHOOK_RECEIVED', 'MARKET_CREATED', 'TRADE_BUY', 'TRADE_SELL'
  walletAddress: text("wallet_address"), // The user associated with the action, if any
  details: text("details"), // JSON string of extra context (payload, errors, etc)
  status: text("status").notNull(), // 'SUCCESS', 'ERROR', 'WARNING'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feeWithdrawals = pgTable("fee_withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  signature: text("signature").unique().notNull(),
  marketPda: text("market_pda").notNull(),
  creatorWallet: text("creator_wallet").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(), // lamports withdrawn
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// TODO: Add `marketPda` column to link each fee to a specific market,
// enabling avatar display in the Protocol Fee Inflows UI.
export const protocolFees = pgTable("protocol_fees", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  signature: text("signature").unique().notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(), // lamports collected
  // TODO: marketPda: text("market_pda") — add after updating indexer/webhook
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const pscBuybacks = pgTable("psc_buybacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  signature: text("signature").unique().notNull(),
  caller: text("caller").notNull(),
  solSpent: bigint("sol_spent", { mode: "number" }).notNull(),
  pscReceived: bigint("psc_received", { mode: "number" }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const pscBurns = pgTable("psc_burns", {
  id: uuid("id").primaryKey().defaultRandom(),
  network: text("network").notNull().default("devnet"),
  signature: text("signature").unique().notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(), // PSC tokens burned
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
