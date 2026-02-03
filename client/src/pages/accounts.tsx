import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Wallet, Building2, CreditCard, PiggyBank, TrendingUp, Landmark, Pencil, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAccountSchema, type Account, type InsertAccount } from "@shared/schema";
import { OwnerBadge } from "@/components/owner-badge";
import { z } from "zod";

const accountFormSchema = insertAccountSchema.extend({
  currentBalance: z.string().transform((val) => val || "0"),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

const accountTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  loan: Landmark,
};

const accountTypeLabels: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  investment: "Investment",
  loan: "Loan",
};

function EditAccountDialog({ account, onClose }: { account: Account; onClose: () => void }) {
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
                      <SelectItem value="credit">Credit Card</SelectItem>
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

function AccountCard({ account }: { account: Account }) {
  const [editOpen, setEditOpen] = useState(false);
  const Icon = accountTypeIcons[account.accountType] || Building2;
  const balance = parseFloat(account.currentBalance as string);
  const isNegative = balance < 0 || account.accountType === 'credit' || account.accountType === 'loan';

  return (
    <>
      <Card className="hover-elevate" data-testid={`card-account-${account.id}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{account.name}</h3>
                <p className="text-sm text-muted-foreground">{account.institution}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                {formatCurrency(Math.abs(balance))}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <Badge variant="secondary" className="mt-1">
                {accountTypeLabels[account.accountType]}
              </Badge>
            </div>
          </div>
          {account.accountNumber && (
            <p className="mt-3 text-xs text-muted-foreground">
              Account: ****{account.accountNumber.slice(-4)}
            </p>
          )}
          {account.notes && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{account.notes}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <OwnerBadge owner={account.owner} variant={account.owner === 'Kevin' ? 'default' : account.owner === 'Jamie' ? 'secondary' : 'outline'} />
              {!account.isActive && (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setEditOpen(true)}
              data-testid={`button-edit-account-${account.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditAccountDialog account={account} onClose={() => setEditOpen(false)} />
      </Dialog>
    </>
  );
}

function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      institution: "",
      accountNumber: "",
      accountType: "checking",
      currentBalance: "0",
      owner: "Kevin",
      notes: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      return apiRequest('POST', '/api/accounts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: "Account created",
        description: "Your new account has been added successfully.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountFormValues) => {
    mutation.mutate(data as InsertAccount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-account">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Add a new bank account, credit card, or investment account.
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
                    <Input placeholder="e.g., USAA Checking" {...field} data-testid="input-account-name" />
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
                    <Input placeholder="e.g., USAA, Navy Federal" {...field} data-testid="input-institution" />
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
                        <SelectTrigger data-testid="select-account-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
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
                        <SelectTrigger data-testid="select-owner">
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-balance" />
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
                      <Input placeholder="Last 4 digits" {...field} value={field.value || ""} data-testid="input-account-number" />
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
                    <Textarea placeholder="Optional notes about this account" {...field} value={field.value || ""} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-account">
                {mutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Accounts() {
  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const checkingAccounts = accounts.filter(a => a.accountType === 'checking');
  const savingsAccounts = accounts.filter(a => a.accountType === 'savings');
  const creditAccounts = accounts.filter(a => a.accountType === 'credit');
  const investmentAccounts = accounts.filter(a => a.accountType === 'investment');
  const loanAccounts = accounts.filter(a => a.accountType === 'loan');

  const totalChecking = checkingAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance as string), 0);
  const totalSavings = savingsAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance as string), 0);
  const totalCredit = creditAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance as string), 0);
  const totalInvestment = investmentAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance as string), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Accounts</h1>
          <p className="text-muted-foreground">Monthly allocations to your bank accounts and credit cards</p>
        </div>
        <AddAccountDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Checking</CardDescription>
            <CardTitle className="text-2xl text-green-500">{formatCurrency(totalChecking)}/mo</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Savings</CardDescription>
            <CardTitle className="text-2xl text-green-500">{formatCurrency(totalSavings)}/mo</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credit Balance</CardDescription>
            <CardTitle className="text-2xl text-red-500">{formatCurrency(totalCredit)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Investments</CardDescription>
            <CardTitle className="text-2xl text-green-500">{formatCurrency(totalInvestment)}/mo</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {checkingAccounts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Checking Accounts</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {checkingAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}
          {savingsAccounts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Savings Accounts</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savingsAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}
          {creditAccounts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Credit Cards</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {creditAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}
          {investmentAccounts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Investment Accounts</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {investmentAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}
          {loanAccounts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Loans</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loanAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}
          {accounts.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
                <p className="text-muted-foreground mb-4">Add your first bank account or credit card to get started.</p>
                <AddAccountDialog />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
