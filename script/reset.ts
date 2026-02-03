
import { db, pool } from '../server/db';
import { 
  transactions, 
  expenses, 
  incomes, 
  savingsAllocations, 
  medicalBills, 
  hsaPaybacks, 
  debts, 
  assets, 
  budgetCategories, 
  accounts,
  users 
} from '@shared/schema';
import { sql } from 'drizzle-orm';

async function reset() {
  console.log('🗑️  Resetting database...');

  try {
    // Disable triggers temporarily to avoid foreign key constraints issues if needed
    // But better to just delete in order
    
    console.log('Deleting transactions...');
    await db.delete(transactions);
    
    console.log('Deleting expenses...');
    await db.delete(expenses);
    
    console.log('Deleting incomes...');
    await db.delete(incomes);
    
    console.log('Deleting savings allocations...');
    await db.delete(savingsAllocations);
    
    console.log('Deleting medical bills...');
    await db.delete(medicalBills);
    
    console.log('Deleting HSA paybacks...');
    await db.delete(hsaPaybacks);
    
    console.log('Deleting debts...');
    await db.delete(debts);
    
    console.log('Deleting assets...');
    await db.delete(assets);
    
    console.log('Deleting budget categories...');
    await db.delete(budgetCategories);
    
    console.log('Deleting accounts...');
    await db.delete(accounts);
    
    console.log('Deleting users...');
    await db.delete(users);

    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

reset();
