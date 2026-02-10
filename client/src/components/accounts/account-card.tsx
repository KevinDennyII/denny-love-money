import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Account, type InsertAccount } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import { OwnerBadge } from "@/components/owner-badge";
import { accountFormSchema, type AccountFormValues, accountTypeIcons, accountTypeLabels } from "./schemas";

export type AccountDisplay = Account & { isDebt?: boolean };

export function EditAccountDialog({ account, onClose }: { account: Account; onClose: () => void }) {
  const { toast } = useToast();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: account.name,
      institution: account.institution,
      accountNumber: account.accountNumber || "",
      accountType: account.accountType,
      currentBalance: account.currentBalance?.toString() || "0",
      owner: account.owner,
      notes: account.notes || "",
      isActive: account.isActive,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertAccount>) => {
      return apiRequest('PATCH', `/api/accounts/${account.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: "Account updated",
        description: "Your account has been updated successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/accounts/${account.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: "Account deleted",
        description: "Your account has been removed.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountFormValues) => {
    updateMutation.mutate(data as InsertAccount);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Account</DialogTitle>
        <DialogDescription>
          Update your account details.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., USAA Checking" {...field} data-testid="input-edit-account-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., USAA, Navy Federal" {...field} data-testid="input-edit-institution" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-account-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-owner">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Kevin">HB (Kevin)</SelectItem>
                      <SelectItem value="Jamie">SC (Jamie)</SelectItem>
                      <SelectItem value="Joint">Joint</SelectItem>
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
              name="currentBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Allocation</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-balance" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Last 4 digits" {...field} value={field.value || ""} data-testid="input-edit-account-number" />
                  </FormControl>
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
                  <Textarea placeholder="Optional notes about this account" {...field} value={field.value || ""} data-testid="input-edit-notes" />
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
              data-testid="button-delete-account"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-account">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

export function AccountCard({ account }: { account: AccountDisplay }) {
  const [editOpen, setEditOpen] = useState(false);
  const Icon = accountTypeIcons[account.accountType] || Building2;
  const balance = parseFloat(account.currentBalance as string);
  const isNegative = balance < 0 || account.accountType === 'credit' || account.accountType === 'loan';

  return (
    <>
      <div 
        className="group flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all"
        data-testid={`card-account-${account.id}`}
      >
        {/* Left: Icon and Info */}
        <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{account.name}</h3>
              <OwnerBadge owner={account.owner} variant={account.owner === 'Kevin' ? 'default' : account.owner === 'Jamie' ? 'secondary' : 'outline'} />
              {!account.isActive && (
                <Badge variant="destructive" className="ml-2">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{account.institution}</span>
              {account.accountNumber && (
                <>
                  <span>•</span>
                  <span>****{account.accountNumber.slice(-4)}</span>
                </>
              )}
            </div>
            {account.lastUpdated && (
              <div className="text-xs text-muted-foreground mt-1">
                Updated: {new Date(account.lastUpdated).toLocaleDateString()} {new Date(account.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Balance & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
          <div className="text-right">
             <div className={`text-xl font-bold ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
              {formatCurrency(Math.abs(balance))}<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <Badge variant="outline" className="mt-1">
                {accountTypeLabels[account.accountType]}
            </Badge>
          </div>
          
          {!account.isDebt && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditOpen(true)}
              data-testid={`button-edit-account-${account.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditAccountDialog account={account} onClose={() => setEditOpen(false)} />
      </Dialog>
    </>
  );
}
