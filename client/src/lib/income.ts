import type { Account, Income } from "@shared/schema";

/** Income linked to an account uses that account's balance; otherwise falls back to stored amount. */
export function getIncomeDisplayAmount(income: Income, account?: Account): number {
  if (account) {
    return parseFloat(account.currentBalance as string);
  }
  return parseFloat(income.amount as string);
}
