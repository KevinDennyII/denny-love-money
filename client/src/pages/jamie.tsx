import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getDebtPayoffProgress } from "@/lib/formatters";
import { getIncomeDisplayAmount } from "@/lib/income";
import { JAMIE_PAYCHECK_PLAN as PLAN } from "@/lib/jamie-paycheck-plan";
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
  ArrowDown,
  PauseCircle,
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

function findJamieChimeChecking(accounts: Account[]): Account | undefined {
  return accounts.find(
    (a) =>
      a.owner === "Jamie" &&
      a.isActive &&
      /chime/i.test(a.name) &&
      a.accountType === "checking" &&
      !/savings/i.test(a.name)
  );
}

function findJamieUsaaChecking(accounts: Account[]): Account | undefined {
  return accounts.find((a) => a.owner === "Jamie" && a.isActive && /usaa/i.test(a.name) && /checking/i.test(a.name));
}

function PaycheckFlowCard() {
  const rows = [
    {
      label: "Chime Savings",
      detail: "Settlement pot — money that would have paid credit cards",
      perCheck: PLAN.toSavingsPerCheck,
      monthly: PLAN.toSavingsMonthly,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Stays in Jamie Chime",
      detail: "Your personal float for the next two weeks",
      perCheck: PLAN.keepInChimePerCheck,
      monthly: PLAN.keepInChimeMonthly,
      tone: "text-foreground",
    },
    {
      label: "USAA Checking",
      detail: "Fun money",
      perCheck: PLAN.funMoneyPerCheck,
      monthly: PLAN.funMoneyMonthly,
      tone: "text-amber-600 dark:text-amber-400",
    },
  ] as const;

  return (
    <Card data-testid="card-paycheck-flow" className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardDescription>Every paycheck (twice a month)</CardDescription>
        <CardTitle className="text-2xl flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span>{formatCurrency(PLAN.perCheck)}</span>
          <span className="text-sm font-normal text-muted-foreground">
            lands in Jamie Chime Checking
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          Then it splits three ways — same numbers every check, nothing left over.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-center text-muted-foreground" aria-hidden>
          <ArrowDown className="h-5 w-5" />
        </div>
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border border-border/60 bg-background/80 px-4 py-3"
            >
              <div className="min-w-0">
                <p className={`font-semibold ${row.tone}`}>{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.detail}</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="font-semibold tabular-nums">{formatCurrency(row.perCheck)} / check</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(row.monthly)} / month
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground pt-1">
          Monthly total {formatCurrency(PLAN.monthly)} = savings {formatCurrency(PLAN.toSavingsMonthly)}{" "}
          + Chime {formatCurrency(PLAN.keepInChimeMonthly)} + fun money{" "}
          {formatCurrency(PLAN.funMoneyMonthly)}.
        </p>
      </CardContent>
    </Card>
  );
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
  const chimeChecking = findJamieChimeChecking(accounts);
  const usaaChecking = findJamieUsaaChecking(accounts);
  const paycheckAmount = paycheck
    ? money(paycheck.amount) || PLAN.monthly
    : PLAN.monthly;

  const totalIncome = jamieIncomes.reduce(
    (sum, i) => sum + getIncomeDisplayAmount(i, accountById(i.accountId)),
    0
  );
  const totalSavings = jamieSavings.reduce((sum, s) => sum + money(s.amount), 0);
  const totalExpenses = jamieExpenses.reduce((sum, e) => sum + money(e.budgetedAmount), 0);
  const totalDebt = sumBalances(consumerDebts);
  const creditTotal = sumBalances(creditCards);
  const creditMinMonthly = creditCards.reduce((sum, d) => sum + money(d.minimumPayment), 0);
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

  const orderedJamieAccounts = [...jamieAccounts].sort((a, b) => {
    const rank = (acct: Account) => {
      if (/chime/i.test(acct.name) && acct.accountType === "checking") return 0;
      if (/usaa/i.test(acct.name) && /checking/i.test(acct.name)) return 1;
      return 2;
    };
    return rank(a) - rank(b);
  });

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
            Your paycheck plan, accounts, and debts — same shared data as the family app.
            {readOnly
              ? " Sign in as SC to edit balances here."
              : " Use Edit on any row — changes save to the database and show everywhere."}
          </p>
        </div>
        <AddDebtDialog />
      </div>

      <PaycheckFlowCard />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Paycheck (monthly)"
          value={formatCurrency(paycheckAmount)}
          description={`${formatCurrency(PLAN.perCheck)} × 2 into Jamie Chime`}
          icon={Wallet}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Settlement pot"
          value={formatCurrency(PLAN.toSavingsMonthly)}
          description={`${formatCurrency(PLAN.toSavingsPerCheck)} / check → Chime Savings`}
          icon={PiggyBank}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Your Chime float"
          value={formatCurrency(PLAN.keepInChimeMonthly)}
          description={`${formatCurrency(PLAN.keepInChimePerCheck)} kept each paycheck`}
          icon={Landmark}
          trend="neutral"
          isLoading={isLoading}
        />
        <StatCard
          title="Fun money (USAA)"
          value={formatCurrency(PLAN.funMoneyMonthly)}
          description={`${formatCurrency(PLAN.funMoneyPerCheck)} / check to USAA Checking`}
          icon={Wallet}
          trend="neutral"
          isLoading={isLoading}
        />
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5" data-testid="card-cc-pause">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <PauseCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <CardTitle className="text-base">Credit cards — pause for settlement</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                We are <span className="font-medium text-foreground">not</span> paying Jamie&apos;s credit
                cards right now. That money goes into the Chime Savings settlement pot instead, so it is
                ready when settlements come. Open card balances still show below for tracking
                {creditMinMonthly > 0
                  ? ` (about ${formatCurrency(creditMinMonthly)}/mo in former minimums)`
                  : ""}
                .
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <DashboardSection title="Debt payoff progress" icon={TrendingUp}>
        <DebtProgressCard debts={jamieDebts} isLoading={debtsLoading} />
      </DashboardSection>

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
        ) : orderedJamieAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Jamie accounts.</p>
        ) : (
          <div className="space-y-3">
            {orderedJamieAccounts.map((account) => (
              <AccountCard key={account.id} account={account} mode="monthly" />
            ))}
            <p className="text-xs text-muted-foreground">
              {chimeChecking
                ? `Chime Checking planned keep: ${formatCurrency(money(chimeChecking.monthlyAllocation))}/mo.`
                : "Add Jamie Chime Checking when ready (not synced yet)."}{" "}
              {usaaChecking
                ? `USAA fun money: ${formatCurrency(money(usaaChecking.monthlyAllocation))}/mo.`
                : null}
            </p>
          </div>
        )}
      </DashboardSection>

      {(jamieSavings.length > 0 || jamieAssets.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {jamieSavings.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Jamie savings &amp; transfers</CardDescription>
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

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <DebtCategory title="Credit cards (paused)" icon={<CreditCard className="h-5 w-5" />} debts={creditCards} />
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
