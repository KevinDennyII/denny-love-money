import type { Account, Income } from "@shared/schema";

/**
 * Income linked to an account uses that account's planned monthly allocation;
 * otherwise falls back to the stored income amount.
 * (Before BankSync, allocations lived in currentBalance.)
 */
export function getIncomeDisplayAmount(income: Income, account?: Account): number {
  if (account) {
    return parseFloat(String(account.monthlyAllocation ?? "0"));
  }
  return parseFloat(String(income.amount));
}
