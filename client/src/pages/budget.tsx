import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Receipt, Zap, Home, Car, Utensils, ShoppingBag, Heart, Smartphone, Pencil, ChevronDown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertExpenseSchema, type Expense, type InsertExpense, type Income } from "@shared/schema";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.extend({
  budgetedAmount: z.string().min(1, "Amount is required"),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

function EditExpenseDialog({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: expense.name,
      budgetedAmount: expense.budgetedAmount?.toString() || "0",
      paymentMethod: expense.paymentMethod || "",
      frequency: expense.frequency,
      dueDay: expense.dueDay || undefined,
      notes: expense.notes || "",
      isActive: expense.isActive,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertExpense>) => {
      return apiRequest('PATCH', `/api/expenses/${expense.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Expense updated",
        description: "Your budget item has been updated.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/expenses/${expense.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Expense deleted",
        description: "Your budget item has been removed.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    updateMutation.mutate(data as InsertExpense);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogDescription>
          Update this budget item.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Electric Bill" {...field} data-testid="input-edit-expense-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="budgetedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-expense-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-frequency">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="bi-monthly">Bi-Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Day (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="31" 
                      placeholder="1-31" 
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      data-testid="input-edit-due-day" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-payment-method">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="chime">Chime Prepaid</SelectItem>
                      <SelectItem value="usaa">USAA Checking</SelectItem>
                      <SelectItem value="nfcu">Navy Federal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-edit-expense-notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="flex justify-between gap-2">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-expense"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-expense">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

function ExpenseCard({ expense, totalBudget }: { expense: Expense; totalBudget: number }) {
  const [editOpen, setEditOpen] = useState(false);
  const amount = parseFloat(expense.budgetedAmount as string);
  const percentage = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;
  const isPaidWithChime = expense.notes?.includes('Chime');

  return (
    <>
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0" data-testid={`expense-item-${expense.id}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium truncate">{expense.name}</span>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {expense.frequency !== 'monthly' && (
                <Badge variant="outline" className="text-xs">
                  {expense.frequency}
                </Badge>
              )}
              {expense.dueDay && (
                <span className="text-xs text-muted-foreground">
                  Due: {expense.dueDay}{expense.dueDay === 1 ? 'st' : expense.dueDay === 2 ? 'nd' : expense.dueDay === 3 ? 'rd' : 'th'}
                </span>
              )}
              {isPaidWithChime && (
                <Badge variant="secondary" className="text-xs">Chime</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="font-semibold">{formatCurrency(amount)}</span>
            <span className="text-xs text-muted-foreground block">{percentage.toFixed(1)}%</span>
          </div>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setEditOpen(true)}
            data-testid={`button-edit-expense-${expense.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditExpenseDialog expense={expense} onClose={() => setEditOpen(false)} />
      </Dialog>
    </>
  );
}

function AddExpenseDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: "",
      budgetedAmount: "",
      paymentMethod: "",
      frequency: "monthly",
      dueDay: undefined,
      notes: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      return apiRequest('POST', '/api/expenses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Expense added",
        description: "Your budget item has been added successfully.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    mutation.mutate(data as InsertExpense);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-expense">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Budget Item</DialogTitle>
          <DialogDescription>
            Add a new recurring expense to your monthly budget.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Electric Bill" {...field} data-testid="input-expense-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budgetedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-expense-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-frequency">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="bi-monthly">Bi-Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Day (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="1-31" 
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-due-day" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="chime">Chime Prepaid</SelectItem>
                        <SelectItem value="usaa">USAA Checking</SelectItem>
                        <SelectItem value="nfcu">Navy Federal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-expense-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-expense">
                {mutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Budget() {
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: incomes = [], isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ['/api/incomes'],
  });

  const isLoading = expensesLoading || incomesLoading;

  const activeExpenses = expenses.filter(e => e.isActive);
  const totalBudget = activeExpenses.reduce((sum, e) => sum + parseFloat(e.budgetedAmount as string), 0);
  const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount as string), 0);
  const remaining = totalIncome - totalBudget;
  const budgetUsedPercent = totalIncome > 0 ? (totalBudget / totalIncome) * 100 : 0;

  const housingExpenses = activeExpenses.filter(e => 
    e.name.toLowerCase().includes('rent') || 
    e.name.toLowerCase().includes('mortgage')
  );
  const utilityExpenses = activeExpenses.filter(e => 
    e.name.toLowerCase().includes('electric') || 
    e.name.toLowerCase().includes('water') || 
    e.name.toLowerCase().includes('sewage') ||
    e.name.toLowerCase().includes('at&t')
  );
  const subscriptionExpenses = activeExpenses.filter(e => 
    e.name.toLowerCase().includes('netflix') || 
    e.name.toLowerCase().includes('tidal') ||
    e.name.toLowerCase().includes('amazon') ||
    e.name.toLowerCase().includes('vpn') ||
    e.name.toLowerCase().includes('subscription') ||
    e.name.toLowerCase().includes('ring') ||
    e.name.toLowerCase().includes('verizon') ||
    e.name.toLowerCase().includes('sirius')
  );
  const foodExpenses = activeExpenses.filter(e => 
    e.name.toLowerCase().includes('groceries') || 
    e.name.toLowerCase().includes('eating out') ||
    e.name.toLowerCase().includes('food')
  );
  const transportExpenses = activeExpenses.filter(e => 
    e.name.toLowerCase().includes('gas') || 
    e.name.toLowerCase().includes('car') ||
    e.name.toLowerCase().includes('auto') ||
    e.name.toLowerCase().includes('insurance')
  );
  const personalExpenses = activeExpenses.filter(e => 
    e.name.toLowerCase().includes('hair') || 
    e.name.toLowerCase().includes('nail') ||
    e.name.toLowerCase().includes('skin') ||
    e.name.toLowerCase().includes('clothing') ||
    e.name.toLowerCase().includes('toiletries')
  );

  const categorizedIds = new Set([
    ...housingExpenses,
    ...utilityExpenses,
    ...subscriptionExpenses,
    ...foodExpenses,
    ...transportExpenses,
    ...personalExpenses
  ].map(e => e.id));

  const otherExpenses = activeExpenses.filter(e => !categorizedIds.has(e.id));

  const categories = [
    { name: "Housing", icon: Home, expenses: housingExpenses, color: "text-blue-500" },
    { name: "Utilities", icon: Zap, expenses: utilityExpenses, color: "text-yellow-500" },
    { name: "Subscriptions", icon: Smartphone, expenses: subscriptionExpenses, color: "text-purple-500" },
    { name: "Food & Dining", icon: Utensils, expenses: foodExpenses, color: "text-orange-500" },
    { name: "Transportation", icon: Car, expenses: transportExpenses, color: "text-green-500" },
    { name: "Personal Care", icon: Heart, expenses: personalExpenses, color: "text-pink-500" },
    { name: "Other", icon: Receipt, expenses: otherExpenses, color: "text-gray-500" },
  ].filter(c => c.expenses.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Budget</h1>
          <p className="text-muted-foreground">Track and manage your monthly expenses</p>
        </div>
        <AddExpenseDialog />
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
          {categories.map((category) => (
            <BudgetCategory 
              key={category.name} 
              category={category} 
              totalBudget={totalBudget} 
            />
          ))}
          {categories.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No budget items yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first expense to track your spending.</p>
                <AddExpenseDialog />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function BudgetCategory({ category, totalBudget }: { category: any, totalBudget: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const categoryTotal = category.expenses.reduce((sum: number, e: Expense) => sum + parseFloat(e.budgetedAmount as string), 0);
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
                ({formatCurrency(categoryTotal)})
              </span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-1 pl-4 border-l-2 border-muted ml-2">
        {category.expenses.map((expense: Expense) => (
          <ExpenseCard key={expense.id} expense={expense} totalBudget={totalBudget} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
