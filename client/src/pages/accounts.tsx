import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { Building2, PiggyBank, TrendingUp, Landmark, Wallet } from "lucide-react";
import { type Account, type Debt } from "@shared/schema";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { AccountCategory } from "@/components/accounts/account-category";
import { type AccountDisplay } from "@/components/accounts/account-card";

export default function Accounts() {
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: debts = [], isLoading: isLoadingDebts } = useQuery<Debt[]>({
    queryKey: ['/api/debts'],
  });

  const isLoading = isLoadingAccounts || isLoadingDebts;

  const checkingAccounts = accounts.filter(a => a.accountType === 'checking');
  const savingsAccounts = accounts.filter(a => a.accountType === 'savings');
  
  // We use credit cards from debts instead of accounts to unify data
  const creditAccounts: AccountDisplay[] = debts
    .filter(d => d.debtType === 'credit_card')
    .map(d => ({
      id: d.id,
      name: d.name,
      institution: d.creditor,
      accountNumber: null, // Debts don't always have this field easily accessible here, or it's not in the Debt type
      accountType: 'credit' as const,
      currentBalance: d.currentBalance,
      owner: d.owner,
      notes: d.notes,
      isActive: !d.isPaidOff,
      lastUpdated: d.lastUpdated,
      isDebt: true // Flag to identify this as a debt-sourced account
    }));

  const investmentAccounts = accounts.filter(a => a.accountType === 'investment');
  const loanAccounts = accounts.filter(a => a.accountType === 'loan');

  const totalChecking = checkingAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance as string), 0);
  const totalSavings = savingsAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance as string), 0);
  const totalCredit = creditAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance as string), 0);
  const totalInvestment = investmentAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance as string), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Accounts</h1>
          <p className="text-muted-foreground">Monthly allocations to your bank accounts and credit cards</p>
        </div>
        <AddAccountDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Checking</CardDescription>
            <CardTitle className="text-2xl text-green-500">{formatCurrency(totalChecking)}/mo</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Savings</CardDescription>
            <CardTitle className="text-2xl text-green-500">{formatCurrency(totalSavings)}/mo</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credit Balance</CardDescription>
            <CardTitle className="text-2xl text-red-500">{formatCurrency(totalCredit)}</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-1">
              Calculated from credit cards on <a href="/debts" className="underline hover:text-primary">Debts page</a>
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Investments</CardDescription>
            <CardTitle className="text-2xl text-green-500">{formatCurrency(totalInvestment)}/mo</CardTitle>
          </CardHeader>
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
            title="Checking Accounts" 
            icon={<Building2 className="h-5 w-5" />}
            accounts={checkingAccounts} 
          />
          <AccountCategory 
            title="Savings Accounts" 
            icon={<PiggyBank className="h-5 w-5" />}
            accounts={savingsAccounts} 
          />
          {/* Credit Cards list hidden as requested, but calculation remains */}
          <AccountCategory 
            title="Investment Accounts" 
            icon={<TrendingUp className="h-5 w-5" />}
            accounts={investmentAccounts} 
          />
          <AccountCategory 
            title="Loans" 
            icon={<Landmark className="h-5 w-5" />}
            accounts={loanAccounts} 
          />
          
          {accounts.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
                <p className="text-muted-foreground mb-4">Add your first bank account or credit card to get started.</p>
                <AddAccountDialog />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
