import { db } from "./db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function runMigrations() {
  console.log("Running database migrations...");

  await db.execute(sql`
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()
  `);

  await db.execute(sql`
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()
  `);

  await db.execute(sql`
    ALTER TABLE debts ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()
  `);

  await db.execute(sql`
    ALTER TABLE debts ADD COLUMN IF NOT EXISTS planned_payment NUMERIC(12,2)
  `);

  await db.execute(sql`
    ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()
  `);

  await db.execute(sql`
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category TEXT
  `);

  await db.execute(sql`
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS monthly_allocation NUMERIC(12,2) NOT NULL DEFAULT 0
  `);

  // One-time backfill: restore planned monthly amounts that used to live in current_balance
  // before BankSync started writing live balances into that column.
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 7550
    WHERE monthly_allocation = 0 AND name ILIKE 'Family USAA Checking'
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 300
    WHERE monthly_allocation = 0 AND name ILIKE 'Jamie USAA Checking'
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 4179
    WHERE monthly_allocation = 0 AND (
      name ILIKE 'Chime Prepaid%' OR name ILIKE 'Chime Checking'
    )
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 200
    WHERE monthly_allocation = 0 AND name ILIKE 'Kevin NFCU Checking'
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 75
    WHERE monthly_allocation = 0 AND name ILIKE 'Kevin Greenwood%'
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 100
    WHERE monthly_allocation = 0 AND (
      name ILIKE '%Schwab Roth%' OR name ILIKE 'Roth Contributory IRA'
    )
  `);

  // Restore SC retirement assets to original static seed values.
  // Schwab BankSync previously wrote the live Roth balance onto Roth IRA - SC by mistake;
  // live Schwab Roth now maps to Roth IRA - HB only.
  await db.execute(sql`
    UPDATE assets
    SET value = 1116.32,
        notes = NULL,
        last_updated = NOW()
    WHERE name ILIKE 'Roth IRA - SC'
  `);
  await db.execute(sql`
    UPDATE assets
    SET value = 2649.73,
        notes = NULL,
        last_updated = NOW()
    WHERE name ILIKE 'Traditional IRA - SC'
  `);

  // Ensure guest user password is set to the correct value
  const guestHash = await bcrypt.hash("community-money", 10);
  await db.execute(
    sql`UPDATE users SET password_hash = ${guestHash}, updated_at = NOW() WHERE username = 'guest'`
  );

  console.log("Database migrations completed.");
}
