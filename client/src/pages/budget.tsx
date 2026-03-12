import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";
import { Receipt, Zap, Home, Car, Utensils, Heart, Smartphone, Plus } from "lucide-react";
import { type Expense, type Income } from "@shared/schema";
import { AddExpenseDialog } from "@/components/budget/add-expense-dialog";
import { BudgetCategory } from "@/components/budget/budget-category";
import { Button } from "@/components/ui/button";

export default function Budget() {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: incomes = [], isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ['/api/incomes'],
  });

  const handleAddExpenseClick = (categoryName: string | null) => {
    setSelectedCategoryName(categoryName);
    setIsAddExpenseOpen(true);
  };

  const isLoading = expensesLoading || incomesLoading;

  const activeExpenses = expenses.filter(e => e.isActive);
  const totalBudget = activeExpenses.reduce((sum, e) => sum + parseFloat(e.budgetedAmount as string), 0);
  const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount as string), 0);
  const remaining = totalIncome - totalBudget;
  const budgetUsedPercent = totalIncome > 0 ? (totalBudget / totalIncome) * 100 : 0;

  const housingExpenses = activeExpenses.filter(e => 
    e.category === 'Housing' ||
    (!e.category && (e.name.toLowerCase().includes('rent') || e.name.toLowerCase().includes('mortgage')))
  );
  const utilityExpenses = activeExpenses.filter(e => 
    e.category === 'Utilities' ||
    (!e.category && (e.name.toLowerCase().includes('electric') || e.name.toLowerCase().includes('water') || e.name.toLowerCase().includes('sewage') || e.name.toLowerCase().includes('at&t')))
  );
  const subscriptionExpenses = activeExpenses.filter(e => 
    e.category === 'Subscriptions' ||
    (!e.category && (e.name.toLowerCase().includes('netflix') || e.name.toLowerCase().includes('tidal') || e.name.toLowerCase().includes('amazon') || e.name.toLowerCase().includes('vpn') || e.name.toLowerCase().includes('subscription') || e.name.toLowerCase().includes('ring') || e.name.toLowerCase().includes('verizon') || e.name.toLowerCase().includes('sirius')))
  );
  const foodExpenses = activeExpenses.filter(e => 
    e.category === 'Food & Dining' ||
    (!e.category && (e.name.toLowerCase().includes('groceries') || e.name.toLowerCase().includes('eating out') || e.name.toLowerCase().includes('food')))
  );
  const transportExpenses = activeExpenses.filter(e => 
    e.category === 'Transportation' ||
    (!e.category && (e.name.toLowerCase().includes('gas') || e.name.toLowerCase().includes('car') || e.name.toLowerCase().includes('auto') || e.name.toLowerCase().includes('insurance')))
  );
  const personalExpenses = activeExpenses.filter(e => 
    e.category === 'Personal Care' ||
    (!e.category && (e.name.toLowerCase().includes('hair') || e.name.toLowerCase().includes('nail') || e.name.toLowerCase().includes('skin') || e.name.toLowerCase().includes('clothing') || e.name.toLowerCase().includes('toiletries')))
  );

  const categorizedIds = new Set([
    ...housingExpenses,
    ...utilityExpenses,
    ...subscriptionExpenses,
    ...foodExpenses,
    ...transportExpenses,
    ...personalExpenses
  ].map(e => e.id));

  const otherExpenses = activeExpenses.filter(e => e.category === 'Other' || (!categorizedIds.has(e.id) && !e.category));

  const categories = [
    { name: "Housing", icon: Home, expenses: housingExpenses, color: "text-blue-500" },
    { name: "Utilities", icon: Zap, expenses: utilityExpenses, color: "text-yellow-500" },
    { name: "Subscriptions", icon: Smartphone, expenses: subscriptionExpenses, color: "text-purple-500" },
    { name: "Food & Dining", icon: Utensils, expenses: foodExpenses, color: "text-orange-500" },
    { name: "Transportation", icon: Car, expenses: transportExpenses, color: "text-green-500" },
    { name: "Personal Care", icon: Heart, expenses: personalExpenses, color: "text-pink-500" },
    { name: "Other", icon: Receipt, expenses: otherExpenses, color: "text-gray-500" },
  ];

  const filteredCategories = categories.filter(c => c.expenses.length > 0);

  return (
    <div className="space-y-6">
      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        categoryName={selectedCategoryName}
        categories={categories}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Budget</h1>
          <p className="text-muted-foreground">Track and manage your monthly expenses</p>
        </div>
        <Button onClick={() => handleAddExpenseClick(null)} data-testid="button-add-expense">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Income</CardDescription>
            <CardTitle className="text-2xl text-green-500" data-testid="text-total-income">
              {formatCurrency(totalIncome)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budgeted Expenses</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-total-budget">
              {formatCurrency(totalBudget)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={budgetUsedPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{budgetUsedPercent.toFixed(1)}% of income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className={`text-2xl ${remaining >= 0 ? 'text-green-500' : 'text-red-500'}`} data-testid="text-remaining">
              {formatCurrency(remaining)}
            </CardTitle>
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
          {filteredCategories.map((category) => (
            <BudgetCategory
              key={category.name}
              category={category}
              totalBudget={totalBudget}
              onAddExpense={() => handleAddExpenseClick(category.name)}
              categories={categories}
            />
          ))}
          {filteredCategories.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No budget items yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first expense to track your spending.</p>
                <Button onClick={() => handleAddExpenseClick(null)} data-testid="button-add-expense-empty">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
