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

  // Ensure guest user password is set to the correct value
  const guestHash = await bcrypt.hash("community-money", 10);
  await db.execute(
    sql`UPDATE users SET password_hash = ${guestHash}, updated_at = NOW() WHERE username = 'guest'`
  );

  console.log("Database migrations completed.");
}
