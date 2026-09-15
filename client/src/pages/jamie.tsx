import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getDebtPayoffProgress } from "@/lib/formatters";
import { getIncomeDisplayAmount } from "@/lib/income";
import {
  Wallet,
  CreditCard,
  ShoppingBag,
  Landmark,
  Receipt,
  PiggyBank,
  TrendingUp,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import type { Account, Asset, Debt, Expense, Income, SavingsAllocation } from "@shared/schema";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DebtProgressCard } from "@/components/dashboard/debt-progress-card";
import { DebtCategory } from "@/components/debts/debt-category";
import { AddDebtDialog } from "@/components/debts/add-debt-dialog";
import { AccountCard } from "@/components/accounts/account-card";
import { IncomeCard } from "@/components/savings/income-card";
import { SavingsCard } from "@/components/savings/savings-card";
import { ExpenseCard } from "@/components/budget/expense-card";
import { AssetCard } from "@/components/networth/asset-card";
import { OwnerBadge } from "@/components/owner-badge";
import { useAuth } from "@/hooks/use-auth";

/** Sheet rollup for micro loans / subscriptions / fees (Sep 2025 Jamie worksheet). */
const MICRO_FEES_MONTHLY_TOTAL = 1050.77;

const MICRO_CREDITORS = new Set(["Affirm", "Afterpay", "Cherry", "Upgrade"]);

const EXPENSE_CATEGORY_OPTIONS = [
  { name: "Housing" },
  { name: "Utilities" },
  { name: "Subscriptions" },
  { name: "Food & Dining" },
  { name: "Transportation" },
  { name: "Personal Care" },
  { name: "Other" },
];

function nameMentionsJamie(name: string): boolean {
  return /jamie/i.test(name);
}

function isMicroDebt(debt: Debt): boolean {
  return (
    MICRO_CREDITORS.has(debt.creditor) ||
    debt.debtType === "pay_later" ||
    (debt.debtType === "other" && /upgrade/i.test(debt.name))
  );
}

function money(value: string | number | null | undefined): number {
  return parseFloat(String(value ?? "0")) || 0;
}

function sortDebtsByProgress(a: Debt, b: Debt): number {
  return (
    getDebtPayoffProgress(b.currentBalance, b.originalBalance) -
    getDebtPayoffProgress(a.currentBalance, a.originalBalance)
  );
}

function sumBalances(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + money(d.currentBalance), 0);
}

export default function JamiePage() {
  const { readOnly } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });
  const { data: incomes = [], isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ["/api/incomes"],
  });
  const { data: savings = [], isLoading: savingsLoading } = useQuery<SavingsAllocation[]>({
    queryKey: ["/api/savings-allocations"],
  });
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });
  const { data: debts = [], isLoading: debtsLoading } = useQuery<Debt[]>({
    queryKey: ["/api/debts"],
  });
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const isLoading =
    accountsLoading || incomesLoading || savingsLoading || expensesLoading || debtsLoading || assetsLoading;

  const jamieAccounts = accounts.filter((a) => a.owner === "Jamie" && a.isActive);
  const jamieIncomes = incomes.filter((i) => i.isActive && nameMentionsJamie(i.name));
  const jamieSavings = savings.filter((s) => s.isActive && nameMentionsJamie(s.name));
  const jamieExpenses = expenses.filter((e) => e.isActive && nameMentionsJamie(e.name));
  const jamieDebts = debts.filter((d) => d.owner === "Jamie");
  const jamieAssets = assets.filter((a) => a.owner === "Jamie");

  const accountById = (id: string | null | undefined) =>
    id ? accounts.find((a) => a.id === id) : undefined;

  const activeDebts = jamieDebts.filter((d) => !d.isPaidOff);
  const paidOffDebts = jamieDebts.filter((d) => d.isPaidOff).sort(sortDebtsByProgress);
  const creditCards = activeDebts.filter((d) => d.debtType === "credit_card").sort(sortDebtsByProgress);
  const microDebts = activeDebts.filter(isMicroDebt).sort(sortDebtsByProgress);
  const studentLoans = activeDebts.filter((d) => d.debtType === "student_loan").sort(sortDebtsByProgress);
  const otherLoans = activeDebts
    .filter((d) => !isMicroDebt(d) && (d.debtType === "auto_loan" || d.debtType === "other"))
    .sort(sortDebtsByProgress);
  const consumerDebts = activeDebts.filter((d) => d.debtType !== "student_loan");

  const paycheck = jamieIncomes.find((i) => /paycheck/i.test(i.name));
  const checking = jamieAccounts.find((a) => /checking/i.test(a.name));
  const paycheckAmount = paycheck
    ? getIncomeDisplayAmount(paycheck, accountById(paycheck.accountId))
    : money(checking?.monthlyAllocation);

  const totalIncome = jamieIncomes.reduce(
    (sum, i) => sum + getIncomeDisplayAmount(i, accountById(i.accountId)),
    0
  );
  const totalSavings = jamieSavings.reduce((sum, s) => sum + money(s.amount), 0);
  const totalExpenses = jamieExpenses.reduce((sum, e) => sum + money(e.budgetedAmount), 0);
  const totalDebt = sumBalances(consumerDebts);
  const creditTotal = sumBalances(creditCards);
  const studentLoanTotal = sumBalances(studentLoans);
  const studentLoanMin = studentLoans.reduce((sum, d) => sum + money(d.minimumPayment), 0);
  const microBalanceTotal = sumBalances(microDebts);
  const totalAssets = jamieAssets.reduce((sum, a) => sum + money(a.value), 0);

  const studentLoanDescription =
    studentLoans.length === 0
      ? "No Jamie student loans"
      : `${studentLoans.length} loan${studentLoans.length === 1 ? "" : "s"}${
          studentLoanMin > 0 ? ` · ${formatCurrency(studentLoanMin)} min/mo` : ""
        }`;

  return (
    <div className="space-y-6" data-testid="page-jamie">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-bold tracking-tight" data-testid="text-page-title">
              Jamie
            </h1>
            <OwnerBadge owner="Jamie" />
          </div>
          <p className="text-muted-foreground">
            Your paycheck, checking, debts, and monthly micro fees — same shared data as the family app.
            {readOnly
              ? " Sign in as SC to edit balances here."
              : " Use Edit on any row — changes save to the database and show everywhere."}
          </p>
        </div>
        <AddDebtDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Paycheck (monthly)"
          value={formatCurrency(paycheckAmount)}
          description={paycheck ? "Biweekly × 2 into Jamie checking" : "From Jamie checking allocation"}
          icon={Wallet}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Checking allocation"
          value={formatCurrency(money(checking?.monthlyAllocation))}
          description="Matches Jamie Paycheck monthly"
          icon={Landmark}
          trend="neutral"
          isLoading={isLoading}
        />
        <StatCard
          title="Active debt"
          value={formatCurrency(totalDebt)}
          description={`${consumerDebts.length} accounts · ${formatCurrency(creditTotal)} cards · excludes student loans`}
          icon={CreditCard}
          trend="down"
          isLoading={isLoading}
        />
        <StatCard
          title="Student loan debt"
          value={formatCurrency(studentLoanTotal)}
          description={studentLoanDescription}
          icon={GraduationCap}
          trend="down"
          isLoading={isLoading}
        />
        <StatCard
          title="Micro / subs / fees"
          value={formatCurrency(MICRO_FEES_MONTHLY_TOTAL)}
          description={`Sheet monthly rollup · ${formatCurrency(microBalanceTotal)} open balance`}
          icon={Receipt}
          trend="neutral"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Jamie income</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalIncome)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : jamieIncomes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No Jamie income rows yet.</p>
            ) : (
              jamieIncomes.map((income) => (
                <IncomeCard
                  key={income.id}
                  income={income}
                  account={accountById(income.accountId)}
                  accounts={accounts}
                />
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Jamie expenses</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalExpenses)}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : jamieExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground">No named Jamie expenses active.</p>
            ) : (
              jamieExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  totalBudget={totalExpenses || 1}
                  categories={EXPENSE_CATEGORY_OPTIONS}
                />
              ))
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Chuck E. Cheese (~$11.99) sits in family Eating out/Entertainment — not listed separately.
            </p>
          </CardContent>
        </Card>
      </div>

      <DashboardSection title="Jamie accounts" icon={Wallet}>
        {accountsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : jamieAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Jamie accounts.</p>
        ) : (
          <div className="space-y-3">
            {jamieAccounts.map((account) => (
              <AccountCard key={account.id} account={account} mode="monthly" />
            ))}
            <p className="text-xs text-muted-foreground">
              Editing Jamie USAA Checking monthly allocation also updates Jamie Paycheck when they are linked.
            </p>
          </div>
        )}
      </DashboardSection>

      {(jamieSavings.length > 0 || jamieAssets.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {jamieSavings.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Jamie savings</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalSavings)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {jamieSavings.map((allocation) => (
                  <SavingsCard
                    key={allocation.id}
                    allocation={allocation}
                    account={accountById(allocation.accountId)}
                    accounts={accounts}
                  />
                ))}
              </CardContent>
            </Card>
          )}
          {jamieAssets.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Jamie assets</CardDescription>
                <CardTitle className="text-2xl text-green-600 dark:text-green-500">
                  {formatCurrency(totalAssets)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {jamieAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
                <Link
                  href="/networth"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Full net worth <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <DashboardSection title="Debt payoff progress" icon={TrendingUp}>
        <DebtProgressCard debts={jamieDebts} isLoading={debtsLoading} />
      </DashboardSection>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <DebtCategory title="Credit cards" icon={<CreditCard className="h-5 w-5" />} debts={creditCards} />
          <DebtCategory
            title="Micro loans & installments"
            icon={<ShoppingBag className="h-5 w-5" />}
            debts={microDebts}
          />
          <DebtCategory title="Student loans" icon={<GraduationCap className="h-5 w-5" />} debts={studentLoans} />
          {otherLoans.length > 0 && (
            <DebtCategory title="Other loans" icon={<Landmark className="h-5 w-5" />} debts={otherLoans} />
          )}
          <DebtCategory title="Paid off" icon={<PiggyBank className="h-5 w-5" />} debts={paidOffDebts} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Edits on this page use the same APIs as Debts, Accounts, Budget, and Savings — so family views stay in
        sync. Guest accounts are view-only; SC/HB admin logins can save changes.
      </p>
    </div>
  );
}
