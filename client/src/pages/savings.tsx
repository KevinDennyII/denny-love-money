import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { getIncomeDisplayAmount } from "@/lib/income";
import { PiggyBank, Wallet } from "lucide-react";
import type { Account, Income, SavingsAllocation } from "@shared/schema";
import { AddSavingsDialog } from "@/components/savings/add-savings-dialog";
import { AddIncomeDialog } from "@/components/savings/add-income-dialog";
import { SavingsCategory } from "@/components/savings/savings-category";
import { IncomeCategory } from "@/components/savings/income-category";

export default function Savings() {
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: incomes = [], isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ['/api/incomes'],
  });

  const { data: savings = [], isLoading: savingsLoading } = useQuery<SavingsAllocation[]>({
    queryKey: ['/api/savings-allocations'],
  });

  const isLoading = accountsLoading || incomesLoading || savingsLoading;

  const getAccount = (id: string | null | undefined) => {
    if (!id) return undefined;
    return accounts.find(a => a.id === id);
  };

  const totalIncome = incomes.reduce(
    (sum, i) => sum + getIncomeDisplayAmount(i, getAccount(i.accountId)),
    0,
  );
  const totalSavings = savings.reduce((sum, s) => sum + parseFloat(s.amount as string), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Income & Savings</h1>
          <p className="text-muted-foreground">Manage your monthly cash flow and savings goals</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AddIncomeDialog accounts={accounts} />
          <AddSavingsDialog accounts={accounts} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Income</CardDescription>
            <CardTitle className="text-2xl text-blue-500" data-testid="text-total-income">
              {formatCurrency(totalIncome)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{incomes.length} sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Savings</CardDescription>
            <CardTitle className="text-2xl text-green-500" data-testid="text-total-savings">
              {formatCurrency(totalSavings)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{savings.length} allocations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="income" data-testid="tab-income">Income Sources</TabsTrigger>
          <TabsTrigger value="savings" data-testid="tab-savings">Savings Goals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income" className="space-y-4 mt-4">
          <IncomeCategory 
            title="Income Sources" 
            icon={<Wallet className="h-5 w-5 text-primary" />} 
            incomes={incomes}
            accounts={accounts}
            getAccount={getAccount}
          />
        </TabsContent>
        
        <TabsContent value="savings" className="space-y-4 mt-4">
          <SavingsCategory 
            title="Savings Allocations" 
            icon={<PiggyBank className="h-5 w-5 text-primary" />} 
            allocations={savings}
            accounts={accounts}
            getAccount={getAccount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
