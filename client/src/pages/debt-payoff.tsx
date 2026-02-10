import { useQuery } from "@tanstack/react-query";
import { Expense, Income, Debt } from "@shared/schema";
import { PayoffSummary } from "@/components/debt-payoff/payoff-summary";
import { AllocationList } from "@/components/debt-payoff/allocation-list";
import { calculateMonthlyAmount } from "@/components/debt-payoff/utils";
import { useState, useEffect } from "react";
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DebtPayoff() {
  const { data: incomes, isLoading: incomesLoading } = useQuery<Income[]>({ 
    queryKey: ["/api/incomes"] 
  });
  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({ 
    queryKey: ["/api/expenses"] 
  });
  const { data: debts, isLoading: debtsLoading } = useQuery<Debt[]>({ 
    queryKey: ["/api/debts"] 
  });

  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Initialize allocations with minimum payments once debts are loaded
  useEffect(() => {
    if (debts) {
      const initialAllocations: Record<string, number> = {};
      debts.forEach(debt => {
        // Preserve existing user edits if any (though this resets on refresh)
        // We only set if not present to avoid overwriting user input during re-renders if debts change
        // But since this runs on debts change, we need to be careful.
        // Simple approach: just use min payment as default in the component if key missing.
        // But we want to sum them up.
        initialAllocations[debt.id] = parseFloat(debt.minimumPayment?.toString() || "0");
      });
      setAllocations(prev => ({ ...initialAllocations, ...prev }));
    }
  }, [debts]);

  if (incomesLoading || expensesLoading || debtsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const totalIncome = incomes?.reduce((sum, income) => {
    // Only active incomes
    // Schema doesn't have isActive for income? Let's check.
    // Schema for Income: name, amount, frequency, accountId. No isActive.
    // So sum all.
    return sum + calculateMonthlyAmount(parseFloat(income.amount.toString()), income.frequency);
  }, 0) || 0;

  const totalExpenses = expenses?.reduce((sum, expense) => {
    if (!expense.isActive) return sum;
    return sum + calculateMonthlyAmount(parseFloat(expense.budgetedAmount.toString()), expense.frequency);
  }, 0) || 0;

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  const handleAllocationChange = (debtId: string, amount: number) => {
    setAllocations(prev => ({
      ...prev,
      [debtId]: amount
    }));
  };

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Debt Payoff Planner</h1>
        <p className="text-muted-foreground">
          Optimize your monthly payments based on your available budget surplus.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          This calculator assumes your <strong>Budgeted Expenses</strong> do not include these debt payments. 
          The "Available for Debt" is your Income minus Expenses.
        </AlertDescription>
      </Alert>

      <PayoffSummary 
        totalIncome={totalIncome} 
        totalExpenses={totalExpenses} 
        totalAllocated={totalAllocated} 
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Allocation Strategy</h2>
        <AllocationList 
          debts={debts || []} 
          allocations={allocations} 
          onAllocationChange={handleAllocationChange} 
        />
      </div>
    </div>
  );
}
