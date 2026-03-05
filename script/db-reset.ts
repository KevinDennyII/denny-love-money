import { db } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Resetting database...');

  // Drop all tables
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS accounts CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS incomes CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS savings_allocations CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS budget_categories CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS expenses CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS debts CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS medical_bills CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS hsa_paybacks CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS assets CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS transactions CASCADE;`);
  await db.execute(sql`DROP TYPE IF EXISTS user_role CASCADE;`);

  console.log('All tables and types dropped.');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error resetting database:', err);
  process.exit(1);
});
