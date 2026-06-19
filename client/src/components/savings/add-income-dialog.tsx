import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, PlusCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type InsertIncome, type Account } from "@shared/schema";
import { incomeFormSchema, type IncomeFormValues } from "./schemas";
import { formatCurrency } from "@/lib/formatters";

export function AddIncomeDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { readOnly } = useAuth();

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      frequency: "monthly",
      accountId: "",
      notes: "",
      isActive: true,
    },
  });

  const selectedAccountId = form.watch("accountId");
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const mutation = useMutation({
    mutationFn: async (data: InsertIncome) => {
      return apiRequest('POST', '/api/incomes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incomes'] });
      toast({
        title: "Income added",
        description: "Your income source has been added.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add income source. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IncomeFormValues) => {
    if (!selectedAccount) return;
    mutation.mutate({
      ...data,
      accountId: selectedAccount.id,
      amount: selectedAccount.currentBalance as string,
    } as InsertIncome);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-income" disabled={readOnly}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Income Source</DialogTitle>
          <DialogDescription>
            Track a new income source.
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
                    <Input placeholder="e.g., Salary" {...field} data-testid="input-income-name" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-income-frequency">
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
                <p className="text-sm font-medium pt-2" data-testid="text-income-amount">
                  {selectedAccount
                    ? formatCurrency(parseFloat(selectedAccount.currentBalance as string))
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Synced from linked account</p>
              </FormItem>
            </div>
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-income-account">
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
                    <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-income-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={mutation.isPending || readOnly || !selectedAccount}
                data-testid="button-submit-income"
              >
                {mutation.isPending ? "Adding..." : "Add Income"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
