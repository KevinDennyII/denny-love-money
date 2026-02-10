import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "./utils";
import { ArrowDown, ArrowUp, DollarSign, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayoffSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalAllocated: number;
}

export function PayoffSummary({ totalIncome, totalExpenses, totalAllocated }: PayoffSummaryProps) {
  const discretionary = totalIncome - totalExpenses;
  const remaining = discretionary - totalAllocated;
  const progress = Math.min(100, Math.max(0, (totalAllocated / discretionary) * 100));
  
  const isOverBudget = remaining < -0.01; // float tolerance
  const isZero = Math.abs(remaining) < 0.01;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <ArrowUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
          <p className="text-xs text-muted-foreground">Total projected income</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          <ArrowDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">Budgeted expenses</p>
        </CardContent>
      </Card>

      <Card className={cn("border-2", isOverBudget ? "border-red-500" : isZero ? "border-emerald-500" : "border-primary/20")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available for Debt</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(discretionary)}</div>
          <p className="text-xs text-muted-foreground">Income - Expenses</p>
        </CardContent>
      </Card>

      <Card className={cn(isOverBudget ? "bg-red-50 dark:bg-red-950/20" : isZero ? "bg-emerald-50 dark:bg-emerald-950/20" : "")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining to Assign</CardTitle>
          <DollarSign className={cn("h-4 w-4", isOverBudget ? "text-red-500" : "text-emerald-500")} />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", isOverBudget ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
            {formatCurrency(remaining)}
          </div>
          <Progress value={progress} className={cn("h-2 mt-2", isOverBudget ? "bg-red-200" : "")} indicatorClassName={isOverBudget ? "bg-red-500" : "bg-primary"} />
        </CardContent>
      </Card>
    </div>
  );
}
