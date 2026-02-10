import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Expense, Income, Debt } from "@shared/schema";
import { PayoffSummary } from "@/components/debt-payoff/payoff-summary";
import { AllocationList } from "@/components/debt-payoff/allocation-list";
import { PaidOffList } from "@/components/debt-payoff/paid-off-list";
import { calculateMonthlyAmount } from "@/components/debt-payoff/utils";
import { useState, useEffect } from "react";
import { Loader2, Info, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DebtPayoff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Initialize allocations with planned payments or minimum payments once debts are loaded
  useEffect(() => {
    if (debts) {
      const initialAllocations: Record<string, number> = {};
      debts.forEach(debt => {
        // Use planned payment if available, otherwise default to minimum payment
        const planned = debt.plannedPayment ? parseFloat(debt.plannedPayment.toString()) : 0;
        const min = parseFloat(debt.minimumPayment?.toString() || "0");
        initialAllocations[debt.id] = planned > 0 ? planned : min;
      });
      setAllocations(prev => ({ ...initialAllocations, ...prev }));
    }
  }, [debts]);

  const updatePlannedPaymentMutation = useMutation({
    mutationFn: async (updatedAllocations: Record<string, number>) => {
      // We need to update each debt with its new planned payment
      const promises = Object.entries(updatedAllocations).map(([debtId, amount]) => 
        apiRequest("PATCH", `/api/debts/${debtId}`, { plannedPayment: amount })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      toast({
        title: "Strategy Saved",
        description: "Your planned monthly payments have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your payment strategy. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (incomesLoading || expensesLoading || debtsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const activeDebts = debts?.filter(d => !d.isPaidOff && parseFloat(d.currentBalance.toString()) > 0) || [];
  const paidOffDebts = debts?.filter(d => d.isPaidOff || parseFloat(d.currentBalance.toString()) <= 0) || [];

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

  const totalAllocated = activeDebts.reduce((sum, debt) => {
    return sum + (allocations[debt.id] || parseFloat(debt.minimumPayment?.toString() || "0"));
  }, 0);

  const handleAllocationChange = (debtId: string, amount: number) => {
    setAllocations(prev => ({
      ...prev,
      [debtId]: amount
    }));
  };

  const handleSaveStrategy = () => {
    updatePlannedPaymentMutation.mutate(allocations);
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Allocation Strategy</h2>
          <Button 
            onClick={handleSaveStrategy} 
            disabled={updatePlannedPaymentMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            {updatePlannedPaymentMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Strategy
          </Button>
        </div>
        <AllocationList 
          debts={activeDebts} 
          allocations={allocations} 
          onAllocationChange={handleAllocationChange} 
        />
      </div>

      {paidOffDebts.length > 0 && (
        <div className="space-y-4 pt-4">
          <PaidOffList debts={paidOffDebts} />
        </div>
      )}
    </div>
  );
}
