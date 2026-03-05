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

  console.log('All tables dropped.');

  // Recreate tables
  await db.execute(sql`${schema.users}`);
  await db.execute(sql`${schema.accounts}`);
  await db.execute(sql`${schema.incomes}`);
  await db.execute(sql`${schema.savingsAllocations}`);
  await db.execute(sql`${schema.budgetCategories}`);
  await db.execute(sql`${schema.expenses}`);
  await db.execute(sql`${schema.debts}`);
  await db.execute(sql`${schema.medicalBills}`);
  await db.execute(sql`${schema.hsaPaybacks}`);
  await db.execute(sql`${schema.assets}`);
  await db.execute(sql`${schema.transactions}`);

  console.log('Database reset successfully!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error resetting database:', err);
  process.exit(1);
});
