import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Expense, type InsertExpense } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import { expenseFormSchema, type ExpenseFormValues } from "./schemas";

export function EditExpenseDialog({ expense, onClose }: { expense: Expense; onClose: () => void }) {
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

export function ExpenseCard({ expense, totalBudget }: { expense: Expense; totalBudget: number }) {
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
            {expense.lastUpdated && (
              <div className="text-xs text-muted-foreground mt-1">
                Updated: {new Date(expense.lastUpdated).toLocaleDateString()} {new Date(expense.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
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
