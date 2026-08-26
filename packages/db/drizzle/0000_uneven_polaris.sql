CREATE TABLE IF NOT EXISTS "creator_markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" text NOT NULL,
	"creator_wallet" text NOT NULL,
	"market_pda" text NOT NULL,
	"supply" bigint DEFAULT 0 NOT NULL,
	"reserve_lamports" bigint DEFAULT 0 NOT NULL,
	"total_volume_lamports" text DEFAULT '0' NOT NULL,
	"claimed" boolean DEFAULT false NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_markets_creator_id_unique" UNIQUE("creator_id"),
	CONSTRAINT "creator_markets_market_pda_unique" UNIQUE("market_pda")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_candles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_pda" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"resolution" text NOT NULL,
	"open" bigint NOT NULL,
	"high" bigint NOT NULL,
	"low" bigint NOT NULL,
	"close" bigint NOT NULL,
	"volume_lamports" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trade_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signature" text NOT NULL,
	"market_pda" text NOT NULL,
	"trader_wallet" text NOT NULL,
	"trade_type" text NOT NULL,
	"amount" bigint NOT NULL,
	"lamports" bigint NOT NULL,
	"fee_lamports" bigint NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trade_history_signature_unique" UNIQUE("signature")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"market_pda" text NOT NULL,
	"position_pda" text NOT NULL,
	"key_balance" bigint DEFAULT 0 NOT NULL,
	"total_bought_lamports" text DEFAULT '0' NOT NULL,
	"total_sold_lamports" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_positions_position_pda_unique" UNIQUE("position_pda")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"username" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
