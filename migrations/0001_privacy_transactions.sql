CREATE TABLE IF NOT EXISTS "privacy_transactions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "privacy_token" varchar(36) NOT NULL,
  "created" timestamp NOT NULL,
  "merchant_descriptor" text NOT NULL,
  "merchant_city" text,
  "merchant_state" text,
  "merchant_country" text,
  "merchant_mcc" text,
  "amount" numeric(12, 2) NOT NULL,
  "settled_amount" numeric(12, 2),
  "status" text NOT NULL,
  "result" text NOT NULL,
  "card_token" varchar(36),
  "card_memo" text,
  "card_last_four" varchar(4),
  "synced_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "privacy_transactions_privacy_token_unique" UNIQUE("privacy_token")
);
