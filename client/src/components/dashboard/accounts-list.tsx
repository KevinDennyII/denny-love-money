import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { Account } from "@shared/schema";

function allocationAmount(account: Account): number {
  return parseFloat(String(account.monthlyAllocation ?? "0"));
}

function withMonthlyAllocation(accounts: Account[], accountType: Account["accountType"]) {
  return accounts
    .filter((a) => a.accountType === accountType && a.isActive && allocationAmount(a) > 0)
    .sort((a, b) => allocationAmount(b) - allocationAmount(a));
}

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

  const checkingAccounts = withMonthlyAllocation(accounts, "checking");
  const savingsAccounts = withMonthlyAllocation(accounts, "savings");

  if (checkingAccounts.length === 0 && savingsAccounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No monthly allocations set.</p>
    );
  }

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
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(allocationAmount(account))}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </span>
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
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(allocationAmount(account))}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
