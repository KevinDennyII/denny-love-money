import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { Account } from "@shared/schema";

export function AccountsList({ accounts, isLoading }: { accounts: Account[]; isLoading: boolean }) {
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
