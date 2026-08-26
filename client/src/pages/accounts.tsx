import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { Building2, PiggyBank, TrendingUp, Landmark, Wallet, CalendarClock, Radio } from "lucide-react";
import { type Account, type Debt } from "@shared/schema";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { AccountCategory } from "@/components/accounts/account-category";
import { isLiveSyncedAccount, type AccountDisplay } from "@/components/accounts/account-card";
import { EmergencySavingsCard } from "@/components/accounts/emergency-savings-card";

export default function Accounts() {
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: debts = [], isLoading: isLoadingDebts } = useQuery<Debt[]>({
    queryKey: ['/api/debts'],
  });

  const isLoading = isLoadingAccounts || isLoadingDebts;

  const monthlyAccounts = accounts
    .filter((a) => a.isActive && parseFloat(String(a.monthlyAllocation ?? "0")) > 0)
    .sort(
      (a, b) =>
        parseFloat(String(b.monthlyAllocation ?? "0")) - parseFloat(String(a.monthlyAllocation ?? "0")),
    );

  const liveAccounts = accounts.filter((a) => a.isActive && isLiveSyncedAccount(a));
  const manualBalanceAccounts = accounts.filter(
    (a) => a.isActive && !isLiveSyncedAccount(a),
  );

  const checkingAccounts = liveAccounts.filter((a) => a.accountType === "checking");
  const savingsAccounts = liveAccounts.filter((a) => a.accountType === "savings");
  const investmentAccounts = liveAccounts.filter((a) => a.accountType === "investment");
  const loanAccounts = liveAccounts.filter((a) => a.accountType === "loan");

  const creditAccounts: AccountDisplay[] = debts
    .filter((d) => d.debtType === "credit_card" && !d.isPaidOff)
    .map((d) => ({
      id: d.id,
      name: d.name,
      institution: d.creditor,
      accountNumber: null,
      accountType: "credit" as const,
      monthlyAllocation: "0",
      currentBalance: d.currentBalance,
      owner: d.owner,
      notes: d.notes,
      isActive: !d.isPaidOff,
      lastUpdated: d.lastUpdated,
      isDebt: true,
      isLiveSynced: /usaa|navy/i.test(d.creditor),
    }));

  const autoLoans: AccountDisplay[] = debts
    .filter((d) => d.debtType === "auto_loan" && !d.isPaidOff)
    .map((d) => ({
      id: d.id,
      name: d.name,
      institution: d.creditor,
      accountNumber: null,
      accountType: "loan" as const,
      monthlyAllocation: d.plannedPayment || d.minimumPayment || "0",
      currentBalance: d.currentBalance,
      owner: d.owner,
      notes: d.notes,
      isActive: !d.isPaidOff,
      lastUpdated: d.lastUpdated,
      isDebt: true,
      isLiveSynced: /navy|usaa/i.test(d.creditor),
    }));

  const totalMonthly = monthlyAccounts.reduce(
    (sum, a) => sum + parseFloat(String(a.monthlyAllocation ?? "0")),
    0,
  );
  const totalLiveAssets = liveAccounts
    .filter((a) => a.accountType !== "loan")
    .reduce((sum, a) => sum + parseFloat(String(a.currentBalance)), 0);
  const totalCredit = creditAccounts.reduce(
    (sum, a) => sum + parseFloat(String(a.currentBalance)),
    0,
  );
  const totalAutoLoans = autoLoans.reduce(
    (sum, a) => sum + parseFloat(String(a.currentBalance)),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold tracking-tight" data-testid="text-page-title">Accounts</h1>
          <p className="text-muted-foreground">
            Monthly contributions you plan, then live balances from BankSync
          </p>
        </div>
        <AddAccountDialog />
      </div>

      <EmergencySavingsCard />

      {/* ===== Monthly contributions ===== */}
      <section className="space-y-4" data-testid="section-monthly-contributions">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Monthly Contributions</h2>
            <p className="text-sm text-muted-foreground">
              What you add to each account each month (budgeted, not the live bank total)
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Monthly Contributions</CardDescription>
              <CardTitle className="text-2xl text-blue-500" data-testid="text-total-monthly">
                {formatCurrency(totalMonthly)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {monthlyAccounts.length} account{monthlyAccounts.length === 1 ? "" : "s"} with a planned amount
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : monthlyAccounts.length > 0 ? (
          <AccountCategory
            title="By Account"
            icon={<CalendarClock className="h-5 w-5" />}
            accounts={monthlyAccounts}
            mode="monthly"
          />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No monthly contributions set yet. Edit an account and fill in Monthly Contribution.
            </CardContent>
          </Card>
        )}
      </section>

      {/* ===== Live / current balances ===== */}
      <section className="space-y-4" data-testid="section-current-balances">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Current Balances</h2>
            <p className="text-sm text-muted-foreground">
              Live totals from BankSync (and any linked credit / auto loan balances)
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Live Account Totals</CardDescription>
              <CardTitle className="text-2xl text-green-500" data-testid="text-total-live">
                {formatCurrency(totalLiveAssets)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Checking, savings, and investments with API data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Credit Cards</CardDescription>
              <CardTitle className="text-2xl text-red-500">{formatCurrency(totalCredit)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground">
                From <a href="/debts" className="underline hover:text-primary">Debts</a>
                {" "}(USAA cards sync via BankSync)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Auto Loans</CardDescription>
              <CardTitle className="text-2xl text-red-500">{formatCurrency(totalAutoLoans)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">NFCU vehicle loan when linked</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <AccountCategory
              title="Checking"
              icon={<Building2 className="h-5 w-5" />}
              accounts={checkingAccounts}
              mode="balance"
            />
            <AccountCategory
              title="Savings"
              icon={<PiggyBank className="h-5 w-5" />}
              accounts={savingsAccounts}
              mode="balance"
            />
            <AccountCategory
              title="Investments / Retirement"
              icon={<TrendingUp className="h-5 w-5" />}
              accounts={investmentAccounts}
              mode="balance"
            />
            <AccountCategory
              title="Loans"
              icon={<Landmark className="h-5 w-5" />}
              accounts={[...loanAccounts, ...autoLoans]}
              mode="balance"
            />

            {manualBalanceAccounts.length > 0 && (
              <AccountCategory
                title="Manual Balances (not linked yet)"
                icon={<Wallet className="h-5 w-5" />}
                accounts={manualBalanceAccounts}
                mode="balance"
              />
            )}

            {accounts.length === 0 && (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first bank account or sync from BankSync to get started.
                  </p>
                  <AddAccountDialog />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
