import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, Receipt, ChevronDown, PieChart, Landmark } from "lucide-react";
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

function DashboardSection({ title, icon: Icon, children, defaultOpen = true }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              <Icon className="h-5 w-5 text-primary" />
              {title}
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
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
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checking</h4>
          <div className="space-y-2">
            {checkingAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm" data-testid={`account-item-${account.id}`}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{account.name}</span>
                  <span className="text-xs text-muted-foreground">{account.institution}</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(account.currentBalance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {savingsAccounts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Savings</h4>
          <div className="space-y-2">
            {savingsAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm" data-testid={`account-item-${account.id}`}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{account.name}</span>
                  <span className="text-xs text-muted-foreground">{account.institution}</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(account.currentBalance)}</span>
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
    <div className="space-y-2">
      {topDebts.map((debt) => {
        const balance = parseFloat(debt.currentBalance as string);
        const original = debt.originalBalance ? parseFloat(debt.originalBalance as string) : balance * 1.5;
        const progress = Math.min(100, ((original - balance) / original) * 100);
        
        return (
          <div key={debt.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground shadow-sm" data-testid={`debt-progress-${debt.id}`}>
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

      <div className="space-y-6">
        <Collapsible defaultOpen className="space-y-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
                <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
                  <Landmark className="h-5 w-5 text-primary" />
                  Net Worth
                  <span className={`text-muted-foreground font-normal text-sm ml-2 ${netWorth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ({formatCurrency(netWorth)})
                  </span>
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto group-data-[state=open]:rotate-180" />
                </h2>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex justify-between items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Total Assets</span>
                </div>
                <span className="font-bold text-green-500">{formatCurrency(totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Total Debts</span>
                </div>
                <span className="font-bold text-red-500">-{formatCurrency(totalDebt)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <DashboardSection title="Monthly Allocations" icon={PieChart}>
          <AccountsList accounts={accounts} isLoading={accountsLoading} />
        </DashboardSection>

        <DashboardSection title="Debt Payoff Progress" icon={CreditCard}>
          <DebtProgressCard debts={debts} isLoading={debtsLoading} />
        </DashboardSection>
      </div>
    </div>
  );
}
