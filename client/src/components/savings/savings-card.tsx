import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Pencil, PiggyBank } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type SavingsAllocation, type InsertSavingsAllocation, type Account } from "@shared/schema";
import { savingsFormSchema, type SavingsFormValues } from "./schemas";
import { formatCurrency } from "@/lib/formatters";

function EditSavingsDialog({ allocation, accounts, onClose }: { allocation: SavingsAllocation; accounts: Account[]; onClose: () => void }) {
  const { toast } = useToast();

  const form = useForm<SavingsFormValues>({
    resolver: zodResolver(savingsFormSchema),
    defaultValues: {
      name: allocation.name,
      amount: allocation.amount?.toString() || "0",
      accountId: allocation.accountId || "",
      notes: allocation.notes || "",
      isActive: allocation.isActive,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertSavingsAllocation>) => {
      return apiRequest('PATCH', `/api/savings-allocations/${allocation.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings-allocations'] });
      toast({
        title: "Savings updated",
        description: "Your savings allocation has been updated.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update savings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/savings-allocations/${allocation.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings-allocations'] });
      toast({
        title: "Savings deleted",
        description: "Your savings allocation has been removed.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete savings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SavingsFormValues) => {
    updateMutation.mutate(data as InsertSavingsAllocation);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Savings Allocation</DialogTitle>
        <DialogDescription>
          Update your savings goal.
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
                  <Input placeholder="e.g., Emergency Fund" {...field} data-testid="input-edit-savings-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-savings-amount" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-savings-account">
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
                  <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-edit-savings-notes" />
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
              data-testid="button-delete-savings"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-savings">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

export function SavingsCard({ allocation, account, accounts }: { allocation: SavingsAllocation; account?: Account; accounts: Account[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const amount = parseFloat(allocation.amount as string);

  return (
    <>
      <div 
        className="group flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all"
        data-testid={`card-savings-${allocation.id}`}
      >
        <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <PiggyBank className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{allocation.name}</h3>
            {account && (
              <p className="text-sm text-muted-foreground">{account.institution}</p>
            )}
            {!allocation.isActive && (
              <Badge variant="destructive" className="mt-1">Inactive</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
          <div className="text-right">
            <p className="text-xl font-bold text-green-500">{formatCurrency(amount)}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditOpen(true)}
            data-testid={`button-edit-savings-${allocation.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditSavingsDialog allocation={allocation} accounts={accounts} onClose={() => setEditOpen(false)} />
      </Dialog>
    </>
  );
}
