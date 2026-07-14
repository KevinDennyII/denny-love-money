import { 
  accounts, insertAccountSchema, type Account, type InsertAccount,
  incomes, insertIncomeSchema, type Income, type InsertIncome,
  savingsAllocations, insertSavingsAllocationSchema, type SavingsAllocation, type InsertSavingsAllocation,
  budgetCategories, type BudgetCategory, type InsertBudgetCategory,
  expenses, insertExpenseSchema, type Expense, type InsertExpense,
  debts, insertDebtSchema, type Debt, type InsertDebt,
  medicalBills, insertMedicalBillSchema, type MedicalBill, type InsertMedicalBill,
  hsaPaybacks, insertHsaPaybackSchema, type HsaPayback, type InsertHsaPayback,
  assets, insertAssetSchema, type Asset, type InsertAsset,
  privacyTransactions, type PrivacyTransaction, type InsertPrivacyTransaction,
  users, type User, type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { desc, eq, sql } from "drizzle-orm";

export interface IStorage {
  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;

  // Incomes
  getIncomes(): Promise<Income[]>;
  getIncome(id: string): Promise<Income | undefined>;
  createIncome(income: InsertIncome): Promise<Income>;
  updateIncome(id: string, income: Partial<InsertIncome>): Promise<Income | undefined>;
  deleteIncome(id: string): Promise<boolean>;

  // Savings Allocations
  getSavingsAllocations(): Promise<SavingsAllocation[]>;
  getSavingsAllocation(id: string): Promise<SavingsAllocation | undefined>;
  createSavingsAllocation(allocation: InsertSavingsAllocation): Promise<SavingsAllocation>;
  updateSavingsAllocation(id: string, allocation: Partial<InsertSavingsAllocation>): Promise<SavingsAllocation | undefined>;
  deleteSavingsAllocation(id: string): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Debts
  getDebts(): Promise<Debt[]>;
  getDebt(id: string): Promise<Debt | undefined>;
  createDebt(debt: InsertDebt): Promise<Debt>;
  updateDebt(id: string, debt: Partial<InsertDebt>): Promise<Debt | undefined>;
  deleteDebt(id: string): Promise<boolean>;

  // Medical Bills
  getMedicalBills(): Promise<MedicalBill[]>;
  getMedicalBill(id: string): Promise<MedicalBill | undefined>;
  createMedicalBill(bill: InsertMedicalBill): Promise<MedicalBill>;
  updateMedicalBill(id: string, bill: Partial<InsertMedicalBill>): Promise<MedicalBill | undefined>;
  deleteMedicalBill(id: string): Promise<boolean>;

  // HSA Paybacks
  getHsaPaybacks(): Promise<HsaPayback[]>;
  getHsaPayback(id: string): Promise<HsaPayback | undefined>;
  createHsaPayback(payback: InsertHsaPayback): Promise<HsaPayback>;
  updateHsaPayback(id: string, payback: Partial<InsertHsaPayback>): Promise<HsaPayback | undefined>;
  deleteHsaPayback(id: string): Promise<boolean>;

  // Assets
  getAssets(): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;

  // Privacy.com transactions
  getPrivacyTransactions(options?: { limit?: number }): Promise<PrivacyTransaction[]>;
  countPrivacyTransactions(): Promise<number>;
  upsertPrivacyTransactions(transactions: InsertPrivacyTransaction[]): Promise<number>;

  // Users (for future auth)
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Accounts
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updated] = await db.update(accounts).set({ ...account, lastUpdated: new Date() }).where(eq(accounts.id, id)).returning();
    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id)).returning();
    return result.length > 0;
  }

  // Incomes
  async getIncomes(): Promise<Income[]> {
    return await db.select().from(incomes);
  }

  async getIncome(id: string): Promise<Income | undefined> {
    const [income] = await db.select().from(incomes).where(eq(incomes.id, id));
    return income;
  }

  async createIncome(income: InsertIncome): Promise<Income> {
    const [newIncome] = await db.insert(incomes).values(income).returning();
    return newIncome;
  }

  async updateIncome(id: string, income: Partial<InsertIncome>): Promise<Income | undefined> {
    const [updated] = await db.update(incomes).set(income).where(eq(incomes.id, id)).returning();
    return updated;
  }

  async deleteIncome(id: string): Promise<boolean> {
    const result = await db.delete(incomes).where(eq(incomes.id, id)).returning();
    return result.length > 0;
  }

  // Savings Allocations
  async getSavingsAllocations(): Promise<SavingsAllocation[]> {
    return await db.select().from(savingsAllocations);
  }

  async getSavingsAllocation(id: string): Promise<SavingsAllocation | undefined> {
    const [allocation] = await db.select().from(savingsAllocations).where(eq(savingsAllocations.id, id));
    return allocation;
  }

  async createSavingsAllocation(allocation: InsertSavingsAllocation): Promise<SavingsAllocation> {
    const [newAllocation] = await db.insert(savingsAllocations).values(allocation).returning();
    return newAllocation;
  }

  async updateSavingsAllocation(id: string, allocation: Partial<InsertSavingsAllocation>): Promise<SavingsAllocation | undefined> {
    const [updated] = await db.update(savingsAllocations).set(allocation).where(eq(savingsAllocations.id, id)).returning();
    return updated;
  }

  async deleteSavingsAllocation(id: string): Promise<boolean> {
    const result = await db.delete(savingsAllocations).where(eq(savingsAllocations.id, id)).returning();
    return result.length > 0;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses);
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set({ ...expense, lastUpdated: new Date() }).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Debts
  async getDebts(): Promise<Debt[]> {
    return await db.select().from(debts);
  }

  async getDebt(id: string): Promise<Debt | undefined> {
    const [debt] = await db.select().from(debts).where(eq(debts.id, id));
    return debt;
  }

  async createDebt(debt: InsertDebt): Promise<Debt> {
    const [newDebt] = await db.insert(debts).values(debt).returning();
    return newDebt;
  }

  async updateDebt(id: string, debt: Partial<InsertDebt>): Promise<Debt | undefined> {
    const [updated] = await db.update(debts).set({ ...debt, lastUpdated: new Date() }).where(eq(debts.id, id)).returning();
    return updated;
  }

  async deleteDebt(id: string): Promise<boolean> {
    const result = await db.delete(debts).where(eq(debts.id, id)).returning();
    return result.length > 0;
  }

  // Medical Bills
  async getMedicalBills(): Promise<MedicalBill[]> {
    return await db.select().from(medicalBills);
  }

  async getMedicalBill(id: string): Promise<MedicalBill | undefined> {
    const [bill] = await db.select().from(medicalBills).where(eq(medicalBills.id, id));
    return bill;
  }

  async createMedicalBill(bill: InsertMedicalBill): Promise<MedicalBill> {
    const [newBill] = await db.insert(medicalBills).values(bill).returning();
    return newBill;
  }

  async updateMedicalBill(id: string, bill: Partial<InsertMedicalBill>): Promise<MedicalBill | undefined> {
    const [updated] = await db.update(medicalBills).set(bill).where(eq(medicalBills.id, id)).returning();
    return updated;
  }

  async deleteMedicalBill(id: string): Promise<boolean> {
    const result = await db.delete(medicalBills).where(eq(medicalBills.id, id)).returning();
    return result.length > 0;
  }

  // HSA Paybacks
  async getHsaPaybacks(): Promise<HsaPayback[]> {
    return await db.select().from(hsaPaybacks);
  }

  async getHsaPayback(id: string): Promise<HsaPayback | undefined> {
    const [payback] = await db.select().from(hsaPaybacks).where(eq(hsaPaybacks.id, id));
    return payback;
  }

  async createHsaPayback(payback: InsertHsaPayback): Promise<HsaPayback> {
    const [newPayback] = await db.insert(hsaPaybacks).values(payback).returning();
    return newPayback;
  }

  async updateHsaPayback(id: string, payback: Partial<InsertHsaPayback>): Promise<HsaPayback | undefined> {
    const [updated] = await db.update(hsaPaybacks).set(payback).where(eq(hsaPaybacks.id, id)).returning();
    return updated;
  }

  async deleteHsaPayback(id: string): Promise<boolean> {
    const result = await db.delete(hsaPaybacks).where(eq(hsaPaybacks.id, id)).returning();
    return result.length > 0;
  }

  // Assets
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets).set({ ...asset, lastUpdated: new Date() }).where(eq(assets.id, id)).returning();
    return updated;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id)).returning();
    return result.length > 0;
  }

  // Privacy.com transactions
  async getPrivacyTransactions(options?: { limit?: number }): Promise<PrivacyTransaction[]> {
    const query = db
      .select()
      .from(privacyTransactions)
      .orderBy(desc(privacyTransactions.created));

    if (options?.limit != null && options.limit > 0) {
      return await query.limit(options.limit);
    }

    return await query;
  }

  async countPrivacyTransactions(): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(privacyTransactions);
    return row?.count ?? 0;
  }

  async upsertPrivacyTransactions(transactions: InsertPrivacyTransaction[]): Promise<number> {
    if (transactions.length === 0) return 0;

    const now = new Date();
    let upserted = 0;

    // Batch in chunks to avoid oversized statements
    const chunkSize = 50;
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);
      const result = await db
        .insert(privacyTransactions)
        .values(chunk.map((tx) => ({ ...tx, syncedAt: now })))
        .onConflictDoUpdate({
          target: privacyTransactions.privacyToken,
          set: {
            created: sql`excluded.created`,
            merchantDescriptor: sql`excluded.merchant_descriptor`,
            merchantCity: sql`excluded.merchant_city`,
            merchantState: sql`excluded.merchant_state`,
            merchantCountry: sql`excluded.merchant_country`,
            merchantMcc: sql`excluded.merchant_mcc`,
            amount: sql`excluded.amount`,
            settledAmount: sql`excluded.settled_amount`,
            status: sql`excluded.status`,
            result: sql`excluded.result`,
            cardToken: sql`excluded.card_token`,
            cardMemo: sql`excluded.card_memo`,
            cardLastFour: sql`excluded.card_last_four`,
            syncedAt: now,
          },
        })
        .returning({ id: privacyTransactions.id });
      upserted += result.length;
    }

    return upserted;
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ ...user, updated_at: new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
