ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "monthly_allocation" numeric(12, 2) DEFAULT '0' NOT NULL;
