import { useState } from "react";
import { ChevronDown, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/formatters";
import { type Expense } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { ExpenseCard } from "./expense-card";

interface BudgetCategoryProps {
  category: any;
  totalBudget: number;
  onAddExpense: () => void;
  categories: any[];
}

export function BudgetCategory({ category, totalBudget, onAddExpense, categories }: BudgetCategoryProps) {
  const { readOnly } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const categoryTotal = category.expenses.reduce((sum: number, e: Expense) => sum + parseFloat(e.budgetedAmount as string), 0);
  const percentage = totalBudget > 0 ? (categoryTotal / totalBudget) * 100 : 0;
  const Icon = category.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              <Icon className={`h-5 w-5 ${category.color}`} />
              {category.name}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {formatCurrency(categoryTotal)} ({percentage.toFixed(0)}%)
              </span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
        <Button variant="outline" size="sm" className="h-7" onClick={onAddExpense} disabled={readOnly}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>
      <CollapsibleContent className="space-y-1 pl-4 border-l-2 border-muted ml-2">
        {category.expenses.map((expense: Expense) => (
          <ExpenseCard key={expense.id} expense={expense} totalBudget={totalBudget} categories={categories} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
