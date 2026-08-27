CREATE TABLE IF NOT EXISTS "markets" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"market_pda" text NOT NULL,
	"creator_handle" text,
	"supply" numeric DEFAULT '0' NOT NULL,
	"reserve" numeric DEFAULT '0' NOT NULL,
	"market_cap" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "markets_creator_id_unique" UNIQUE("creator_id"),
	CONSTRAINT "markets_market_pda_unique" UNIQUE("market_pda")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"signature" text NOT NULL,
	"market_pda" text NOT NULL,
	"trade_type" text NOT NULL,
	"user_wallet" text NOT NULL,
	"key_amount" numeric NOT NULL,
	"sol_amount" numeric NOT NULL,
	"fee_amount" numeric NOT NULL,
	"timestamp" timestamp NOT NULL,
	CONSTRAINT "trades_signature_unique" UNIQUE("signature")
);
