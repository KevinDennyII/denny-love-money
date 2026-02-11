import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, Receipt, ChevronDown, PieChart, Landmark } from "lucide-react";
import type { Account, Expense, Debt, Income, SavingsAllocation, Asset } from "@shared/schema";

import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { AccountsList } from "@/components/dashboard/accounts-list";
import { DebtProgressCard } from "@/components/dashboard/debt-progress-card";

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
          description="Budgeted contributions"
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
