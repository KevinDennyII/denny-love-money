import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";
import type { Debt } from "@shared/schema";
import { Link } from "wouter";

export function DebtProgressCard({ debts, isLoading }: { debts: Debt[]; isLoading: boolean }) {
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
  
  const totalCreditDebt = debts
    .filter(d => !d.isPaidOff && d.debtType === "credit_card")
    .reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);

  return (
    <div className="space-y-2">
      <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium">Credit Balance</span>
          <span className="font-bold text-red-500">{formatCurrency(totalCreditDebt)}</span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          Calculated from credit cards on <Link href="/debts" className="text-primary hover:underline">Debts page</Link>
        </div>
      </div>

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
