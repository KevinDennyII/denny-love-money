import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, Receipt } from "lucide-react";
import type { Account, Expense, Debt, Income, SavingsAllocation, Asset } from "@shared/schema";

interface DashboardStats {
  totalIncome: number;
  totalSavings: number;
  totalExpenses: number;
  totalDebt: number;
  netWorth: number;
  accounts: Account[];
  recentDebts: Debt[];
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  isLoading,
}: { 
  title: string; 
  value: string; 
  description?: string; 
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
}) {
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${trendColor}`}>{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AccountsList({ accounts, isLoading }: { accounts: Account[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const checkingAccounts = accounts.filter(a => a.accountType === 'checking' && a.isActive);
  const savingsAccounts = accounts.filter(a => a.accountType === 'savings' && a.isActive);

  return (
    <div className="space-y-4">
      {checkingAccounts.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Checking</h4>
          <div className="space-y-2">
            {checkingAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between" data-testid={`account-item-${account.id}`}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{account.name}</span>
                  <span className="text-xs text-muted-foreground">{account.institution}</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(account.currentBalance)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
      {savingsAccounts.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Savings</h4>
          <div className="space-y-2">
            {savingsAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between" data-testid={`account-item-${account.id}`}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{account.name}</span>
                  <span className="text-xs text-muted-foreground">{account.institution}</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(account.currentBalance)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DebtProgressCard({ debts, isLoading }: { debts: Debt[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const topDebts = debts
    .filter(d => !d.isPaidOff)
    .sort((a, b) => parseFloat(b.currentBalance as string) - parseFloat(a.currentBalance as string))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {topDebts.map((debt) => {
        const balance = parseFloat(debt.currentBalance as string);
        const original = debt.originalBalance ? parseFloat(debt.originalBalance as string) : balance * 1.5;
        const progress = Math.min(100, ((original - balance) / original) * 100);
        
        return (
          <div key={debt.id} className="space-y-2" data-testid={`debt-progress-${debt.id}`}>
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate flex-1 mr-2">{debt.name}</span>
              <span className="text-muted-foreground">{formatCurrency(balance)}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        );
      })}
      {topDebts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No active debts</p>
      )}
    </div>
  );
}

function BudgetOverview({ expenses, isLoading }: { expenses: Expense[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.notes?.includes('Paid with Chime') ? 'Chime Expenses' : 'Other Expenses';
    const amount = parseFloat(expense.budgetedAmount as string);
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const totalBudgeted = expenses.reduce((sum, e) => sum + parseFloat(e.budgetedAmount as string), 0);

  return (
    <div className="space-y-4">
      {categories.map(([category, amount]) => (
        <div key={category} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{category}</span>
            <span className="text-muted-foreground">{formatCurrency(amount)}</span>
          </div>
          <Progress value={(amount / totalBudgeted) * 100} className="h-2" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: incomes = [], isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ['/api/incomes'],
  });

  const { data: savings = [], isLoading: savingsLoading } = useQuery<SavingsAllocation[]>({
    queryKey: ['/api/savings-allocations'],
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: debts = [], isLoading: debtsLoading } = useQuery<Debt[]>({
    queryKey: ['/api/debts'],
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  const isLoading = accountsLoading || incomesLoading || savingsLoading || expensesLoading || debtsLoading || assetsLoading;

  const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount as string), 0);
  const totalSavings = savings.reduce((sum, s) => sum + parseFloat(s.amount as string), 0);
  const totalExpenses = expenses.filter(e => e.isActive).reduce((sum, e) => sum + parseFloat(e.budgetedAmount as string), 0);
  const totalDebt = debts.filter(d => !d.isPaidOff).reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);
  const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.value as string), 0);
  const netWorth = totalAssets - totalDebt;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">Your family financial overview at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(totalIncome)}
          description="After savings allocations"
          icon={Wallet}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency(totalSavings)}
          description="Across all accounts"
          icon={PiggyBank}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          description="Budgeted spending"
          icon={Receipt}
          trend="neutral"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Debt"
          value={formatCurrency(totalDebt)}
          description={`${debts.filter(d => d.isPaidOff).length} debts paid off`}
          icon={CreditCard}
          trend="down"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:row-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Net Worth</CardTitle>
                <CardDescription>Assets minus liabilities</CardDescription>
              </div>
              {netWorth >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <>
                <div className={`text-4xl font-bold ${netWorth >= 0 ? 'text-green-500' : 'text-red-500'}`} data-testid="text-networth">
                  {formatCurrency(netWorth)}
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Assets</span>
                    <span className="font-semibold text-green-500">{formatCurrency(totalAssets)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Debts</span>
                    <span className="font-semibold text-red-500">-{formatCurrency(totalDebt)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Allocations</CardTitle>
            <CardDescription>Income allocated to each account</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountsList accounts={accounts} isLoading={accountsLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Debt Payoff Progress</CardTitle>
            <CardDescription>Top 5 active debts</CardDescription>
          </CardHeader>
          <CardContent>
            <DebtProgressCard debts={debts} isLoading={debtsLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
