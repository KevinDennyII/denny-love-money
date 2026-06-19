import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Pencil, Wallet } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Income, type InsertIncome, type Account } from "@shared/schema";
import { incomeFormSchema, type IncomeFormValues } from "./schemas";
import { formatCurrency } from "@/lib/formatters";
import { getIncomeDisplayAmount } from "@/lib/income";
import { motion } from "framer-motion";

function EditIncomeDialog({ income, accounts, onClose }: { income: Income; accounts: Account[]; onClose: () => void }) {
  const { toast } = useToast();
  const { readOnly } = useAuth();

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      name: income.name,
      amount: income.amount?.toString() || "0",
      frequency: income.frequency,
      accountId: income.accountId || "",
      notes: income.notes || "",
      isActive: income.isActive,
    },
  });

  const linkedAccount = accounts.find(a => a.id === form.watch("accountId"));

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertIncome>) => {
      return apiRequest('PATCH', `/api/incomes/${income.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incomes'] });
      toast({
        title: "Income updated",
        description: "Your income source has been updated.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update income. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/incomes/${income.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incomes'] });
      toast({
        title: "Income deleted",
        description: "Your income source has been removed.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete income. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IncomeFormValues) => {
    const { amount: _amount, ...rest } = data;
    const payload: InsertIncome = {
      ...rest,
      amount: linkedAccount
        ? (linkedAccount.currentBalance as string)
        : income.amount as string,
    } as InsertIncome;
    updateMutation.mutate(payload);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Income Source</DialogTitle>
        <DialogDescription>
          Update your income details.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Salary" {...field} data-testid="input-edit-income-name" disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-income-frequency">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <p className="text-sm font-medium pt-2" data-testid="text-edit-income-amount">
                {linkedAccount
                  ? formatCurrency(parseFloat(linkedAccount.currentBalance as string))
                  : formatCurrency(parseFloat(income.amount as string))}
              </p>
              <p className="text-xs text-muted-foreground">
                {linkedAccount ? "Synced from linked account" : "Update on the Accounts page"}
              </p>
            </FormItem>
          </div>
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deposit Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={readOnly}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-income-account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-edit-income-notes" disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="flex justify-between gap-2">
            {!readOnly && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-income"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button type="submit" disabled={updateMutation.isPending || readOnly} data-testid="button-save-income">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

export function IncomeCard({ income, account, accounts }: { income: Income; account?: Account; accounts: Account[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const { readOnly } = useAuth();
  const amount = getIncomeDisplayAmount(income, account);

  return (
    <motion.div layout>
      <div 
        className="group flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all"
        data-testid={`card-income-${income.id}`}
      >
        <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{income.name}</h3>
            {account && (
              <p className="text-sm text-muted-foreground">{account.institution}</p>
            )}
            {!income.isActive && (
              <Badge variant="destructive" className="mt-1">Inactive</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
          <div className="text-right">
            <p className="text-xl font-bold text-blue-500">{formatCurrency(amount)}</p>
            <Badge variant="outline" className="mt-1">{income.frequency}</Badge>
          </div>
          
          {!readOnly && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditOpen(true)}
              data-testid={`button-edit-income-${income.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditIncomeDialog income={income} accounts={accounts} onClose={() => setEditOpen(false)} />
      </Dialog>
    </motion.div>
  );
}
