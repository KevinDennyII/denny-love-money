import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, boolean, date, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Financial Accounts (Checking, Savings, Credit Cards, Investments)
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  institution: text("institution").notNull(),
  accountNumber: text("account_number"),
  accountType: text("account_type").notNull(), // checking, savings, credit, investment, loan
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  owner: text("owner").notNull(), // Kevin, Jamie, Joint
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// Income Sources
export const incomes = pgTable("incomes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // monthly, bi-weekly, weekly
  accountId: varchar("account_id").references(() => accounts.id),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertIncomeSchema = createInsertSchema(incomes).omit({ id: true });
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type Income = typeof incomes.$inferSelect;

// Savings Allocations
export const savingsAllocations = pgTable("savings_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  accountId: varchar("account_id").references(() => accounts.id),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertSavingsAllocationSchema = createInsertSchema(savingsAllocations).omit({ id: true });
export type InsertSavingsAllocation = z.infer<typeof insertSavingsAllocationSchema>;
export type SavingsAllocation = typeof savingsAllocations.$inferSelect;

// Budget Categories
export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  parentId: varchar("parent_id"),
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({ id: true });
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;

// Monthly Expenses (Budget Items)
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  budgetedAmount: decimal("budgeted_amount", { precision: 12, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => budgetCategories.id),
  paymentMethod: text("payment_method"), // which account pays this
  frequency: text("frequency").notNull().default("monthly"), // monthly, bi-monthly, yearly
  dueDay: integer("due_day"), // day of month when due
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Debts (Credit Cards, Loans, Pay Later)
export const debts = pgTable("debts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  creditor: text("creditor").notNull(),
  debtType: text("debt_type").notNull(), // credit_card, pay_later, auto_loan, student_loan
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).notNull(),
  originalBalance: decimal("original_balance", { precision: 12, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  minimumPayment: decimal("minimum_payment", { precision: 12, scale: 2 }),
  dueDay: integer("due_day"),
  owner: text("owner").notNull(), // Kevin, Jamie
  notes: text("notes"),
  isPaidOff: boolean("is_paid_off").notNull().default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertDebtSchema = createInsertSchema(debts).omit({ id: true, lastUpdated: true });
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type Debt = typeof debts.$inferSelect;

// Medical Bills
export const medicalBills = pgTable("medical_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billName: text("bill_name").notNull(),
  provider: text("provider"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  amountRemaining: decimal("amount_remaining", { precision: 12, scale: 2 }).notNull(),
  monthlyPayment: decimal("monthly_payment", { precision: 12, scale: 2 }),
  paymentDay: integer("payment_day"),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  isPaidOff: boolean("is_paid_off").notNull().default(false),
});

export const insertMedicalBillSchema = createInsertSchema(medicalBills).omit({ id: true });
export type InsertMedicalBill = z.infer<typeof insertMedicalBillSchema>;
export type MedicalBill = typeof medicalBills.$inferSelect;

// HSA Paybacks
export const hsaPaybacks = pgTable("hsa_paybacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  year: integer("year").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  notes: text("notes"),
});

export const insertHsaPaybackSchema = createInsertSchema(hsaPaybacks).omit({ id: true });
export type InsertHsaPayback = z.infer<typeof insertHsaPaybackSchema>;
export type HsaPayback = typeof hsaPaybacks.$inferSelect;

// Assets for Net Worth
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  assetType: text("asset_type").notNull(), // cash, vehicle, investment, retirement, other
  owner: text("owner"), // Kevin, Jamie, Joint
  notes: text("notes"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, lastUpdated: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

// Transactions (for tracking actual spending)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => budgetCategories.id),
  accountId: varchar("account_id").references(() => accounts.id),
  isIncome: boolean("is_income").notNull().default(false),
  notes: text("notes"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Keep user schema for potential future auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
