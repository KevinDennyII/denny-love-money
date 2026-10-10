import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatCurrency, getDebtPayoffProgress } from "@/lib/formatters";
import { getIncomeDisplayAmount } from "@/lib/income";
import { JAMIE_PAYCHECK_PLAN as PLAN, paycheckTbdMonthly } from "@/lib/jamie-paycheck-plan";
import {
  Wallet,
  CreditCard,
  ShoppingBag,
  Landmark,
  Receipt,
  PiggyBank,
  ArrowRight,
  GraduationCap,
  ArrowDown,
  PauseCircle,
  Pencil,
} from "lucide-react";
import type { Account, Asset, Debt, Expense, Income, SavingsAllocation } from "@shared/schema";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DebtCategory } from "@/components/debts/debt-category";
import { AddDebtDialog } from "@/components/debts/add-debt-dialog";
import {
  AccountCard,
  EditAccountDialog,
  isLiveSyncedAccount,
} from "@/components/accounts/account-card";
import { IncomeCard } from "@/components/savings/income-card";
import { SavingsCard } from "@/components/savings/savings-card";
import { ExpenseCard } from "@/components/budget/expense-card";
import { AssetCard } from "@/components/networth/asset-card";
import { OwnerBadge } from "@/components/owner-badge";
import { LiveBadge } from "@/components/live-badge";
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

/** Joint Chime Savings — Jamie's CC settlement pot (live BankSync balance). */
function findSettlementPotAccount(accounts: Account[]): Account | undefined {
  const candidates = accounts.filter(
    (a) =>
      a.isActive &&
      a.accountType === "savings" &&
      !/jamie/i.test(a.name) &&
      /chime/i.test(`${a.name} ${a.institution}`) &&
      (a.owner === "Joint" ||
        /settlement/i.test(a.notes ?? "") ||
        /settlement|payoff/i.test(a.name)),
  );
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  // Prefer the BankSync-backed row when a seeded duplicate still sits at $0.
  return [...candidates].sort((a, b) => {
    const byBalance = money(b.currentBalance) - money(a.currentBalance);
    if (byBalance !== 0) return byBalance;
    const byLast4 = (b.accountNumber ? 1 : 0) - (a.accountNumber ? 1 : 0);
    if (byLast4 !== 0) return byLast4;
    const score = (x: Account) =>
      (/payoff|settlement/i.test(x.name) ? 2 : 0) +
      (/settlement/i.test(x.notes ?? "") ? 1 : 0);
    const byScore = score(b) - score(a);
    if (byScore !== 0) return byScore;
    const aT = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
    const bT = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
    return bT - aT;
  })[0];
}

function SettlementPotRow({ account }: { account: Account }) {
  const { readOnly } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const balance = money(account.currentBalance);
  const live = isLiveSyncedAccount(account);

  return (
    <>
      <div
        className="group flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all"
        data-testid={`card-settlement-pot-${account.id}`}
      >
        <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
            <PiggyBank className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-lg">Settlement pot</h3>
              {live && <LiveBadge />}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
          <div className="text-right">
            <p className="text-xl font-bold text-emerald-500">{formatCurrency(balance)}</p>
            <Badge variant="outline" className="mt-1">
              Live balance
            </Badge>
          </div>
          {!readOnly && (
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={() => setEditOpen(true)}
              data-testid={`button-edit-settlement-pot-${account.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditAccountDialog account={account} onClose={() => setEditOpen(false)} />
      </Dialog>
    </>
  );
}

function formatPlanAmount(amount: number | null, suffix: string): string {
  if (amount == null) return `TBD${suffix}`;
  return `${formatCurrency(amount)}${suffix}`;
}

function PaycheckFlowCard() {
  const tbdMonthly = paycheckTbdMonthly();
  const rows: {
    label: string;
    detail: string;
    perCheck: number | null;
    monthly: number | null;
    tone: string;
  }[] = [
    {
      label: "Chime Savings (Settlement Pot)",
      detail: "Money that would have paid credit cards",
      perCheck: PLAN.settlementPerCheck,
      monthly: PLAN.settlementMonthly,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Jamie Chime Savings",
      detail: "Family sink / travel funds",
      perCheck: PLAN.familySinkPerCheck,
      monthly: PLAN.familySinkMonthly,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Jamie Chime Checking",
      detail: "Personal float for the next two weeks",
      perCheck: PLAN.keepInChimePerCheck,
      monthly: PLAN.keepInChimeMonthly,
      tone: "text-muted-foreground",
    },
    {
      label: "Jamie USAA Checking",
      detail: "Fun money / personal USAA",
      perCheck: PLAN.usaaPerCheck,
      monthly: PLAN.usaaMonthly,
      tone: "text-muted-foreground",
    },
  ];

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
          Then it splits — settlement and family sink are set; Chime float and USAA amounts TBD.
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
                <p className="font-semibold tabular-nums">
                  {formatPlanAmount(row.perCheck, " / check")}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatPlanAmount(row.monthly, " / month")}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground pt-1">
          Monthly total {formatCurrency(PLAN.monthly)} = settlement{" "}
          {formatCurrency(PLAN.settlementMonthly)} + family sink {formatCurrency(PLAN.familySinkMonthly)}{" "}
          + Chime Checking &amp; USAA (amounts TBD, {formatCurrency(tbdMonthly)} remaining).
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
  const settlementPot = findSettlementPotAccount(accounts);
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
          value={formatCurrency(PLAN.settlementMonthly)}
          description={`${formatCurrency(PLAN.settlementPerCheck)} / check → Chime Savings`}
          icon={PiggyBank}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Family sink / travel"
          value={formatCurrency(PLAN.familySinkMonthly)}
          description={`${formatCurrency(PLAN.familySinkPerCheck)} / check → Jamie Chime Savings`}
          icon={PiggyBank}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Chime float + USAA"
          value="TBD"
          description={`${formatCurrency(paycheckTbdMonthly())} / mo remaining to allocate`}
          icon={Landmark}
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
            {!isLoading && settlementPot && <SettlementPotRow account={settlementPot} />}
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

      <PaycheckFlowCard />

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
              Settlement pot {formatCurrency(PLAN.settlementMonthly)}/mo and family sink{" "}
              {formatCurrency(PLAN.familySinkMonthly)}/mo are set. Jamie Chime Checking float and USAA
              Checking amounts are TBD
              {chimeChecking || usaaChecking
                ? ` (account rows still editable below).`
                : "."}
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
