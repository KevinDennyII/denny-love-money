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
import { Plus, PiggyBank, Wallet, Pencil } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertSavingsAllocationSchema, insertIncomeSchema, type SavingsAllocation, type InsertSavingsAllocation, type Income, type InsertIncome, type Account } from "@shared/schema";
import { z } from "zod";

const savingsFormSchema = insertSavingsAllocationSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

const incomeFormSchema = insertIncomeSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type SavingsFormValues = z.infer<typeof savingsFormSchema>;
type IncomeFormValues = z.infer<typeof incomeFormSchema>;

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

function EditIncomeDialog({ income, accounts, onClose }: { income: Income; accounts: Account[]; onClose: () => void }) {
  const { toast } = useToast();

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
    updateMutation.mutate(data as InsertIncome);
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
                  <Input placeholder="e.g., Salary" {...field} data-testid="input-edit-income-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-income-amount" />
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
          </div>
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deposit Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
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
                  <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-edit-income-notes" />
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
              data-testid="button-delete-income"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-income">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

function SavingsCard({ allocation, account, accounts }: { allocation: SavingsAllocation; account?: Account; accounts: Account[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const amount = parseFloat(allocation.amount as string);

  return (
    <>
      <Card className="hover-elevate" data-testid={`card-savings-${allocation.id}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 dark:bg-green-900">
                <PiggyBank className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">{allocation.name}</h3>
                {account && (
                  <p className="text-sm text-muted-foreground">{account.institution}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-500">{formatCurrency(amount)}</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          </div>
          {allocation.notes && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{allocation.notes}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            {!allocation.isActive && (
              <Badge variant="secondary">Inactive</Badge>
            )}
            <div className="flex-1" />
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => setEditOpen(true)}
              data-testid={`button-edit-savings-${allocation.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditSavingsDialog allocation={allocation} accounts={accounts} onClose={() => setEditOpen(false)} />
      </Dialog>
    </>
  );
}

function IncomeCard({ income, account, accounts }: { income: Income; account?: Account; accounts: Account[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const amount = parseFloat(income.amount as string);

  return (
    <>
      <Card className="hover-elevate" data-testid={`card-income-${income.id}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">{income.name}</h3>
                {account && (
                  <p className="text-sm text-muted-foreground">{account.institution}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-500">{formatCurrency(amount)}</p>
              <Badge variant="outline" className="mt-1">{income.frequency}</Badge>
            </div>
          </div>
          {income.notes && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{income.notes}</p>
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => setEditOpen(true)}
              data-testid={`button-edit-income-${income.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditIncomeDialog income={income} accounts={accounts} onClose={() => setEditOpen(false)} />
      </Dialog>
    </>
  );
}

function AddSavingsDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SavingsFormValues>({
    resolver: zodResolver(savingsFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      accountId: "",
      notes: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertSavingsAllocation) => {
      return apiRequest('POST', '/api/savings-allocations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings-allocations'] });
      toast({
        title: "Savings allocation added",
        description: "Your savings goal has been added.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add savings allocation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SavingsFormValues) => {
    mutation.mutate(data as InsertSavingsAllocation);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-savings">
          <Plus className="h-4 w-4 mr-2" />
          Add Savings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Savings Allocation</DialogTitle>
          <DialogDescription>
            Set up a monthly savings contribution.
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
                    <Input placeholder="e.g., Emergency Fund" {...field} data-testid="input-savings-name" />
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
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-savings-amount" />
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
                      <SelectTrigger data-testid="select-savings-account">
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
                    <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-savings-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-savings">
                {mutation.isPending ? "Adding..." : "Add Savings"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddIncomeDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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
        description: "Failed to add income. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IncomeFormValues) => {
    mutation.mutate(data as InsertIncome);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-income">
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Income Source</DialogTitle>
          <DialogDescription>
            Track a recurring income source.
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-income-amount" />
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
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-income">
                {mutation.isPending ? "Adding..." : "Add Income"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Savings() {
  const { data: savings = [], isLoading: savingsLoading } = useQuery<SavingsAllocation[]>({
    queryKey: ['/api/savings-allocations'],
  });

  const { data: incomes = [], isLoading: incomesLoading } = useQuery<Income[]>({
    queryKey: ['/api/incomes'],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const isLoading = savingsLoading || incomesLoading || accountsLoading;

  const activeSavings = savings.filter(s => s.isActive);
  const totalSavings = activeSavings.reduce((sum, s) => sum + parseFloat(s.amount as string), 0);

  const activeIncomes = incomes.filter(i => i.isActive);
  const totalIncome = activeIncomes.reduce((sum, i) => sum + parseFloat(i.amount as string), 0);

  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const getAccountForId = (id: string | null | undefined) => {
    if (!id) return undefined;
    return accounts.find(a => a.id === id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Savings Goals</h1>
          <p className="text-muted-foreground">Track your income and savings allocations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AddIncomeDialog accounts={accounts} />
          <AddSavingsDialog accounts={accounts} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Income</CardDescription>
            <CardTitle className="text-2xl text-blue-500" data-testid="text-total-income">
              {formatCurrency(totalIncome)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{activeIncomes.length} income sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Savings</CardDescription>
            <CardTitle className="text-2xl text-green-500" data-testid="text-total-savings">
              {formatCurrency(totalSavings)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{activeSavings.length} savings allocations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Savings Rate</CardDescription>
            <CardTitle className={`text-2xl ${savingsRate >= 20 ? 'text-green-500' : savingsRate >= 10 ? 'text-yellow-500' : 'text-red-500'}`}>
              {savingsRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {savingsRate >= 20 ? 'Excellent!' : savingsRate >= 10 ? 'Good progress' : 'Room to improve'}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              Income Sources
            </h2>
            {activeIncomes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeIncomes.map((income) => (
                  <IncomeCard 
                    key={income.id} 
                    income={income} 
                    account={getAccountForId(income.accountId)}
                    accounts={accounts}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-8">
                <CardContent className="text-center">
                  <Wallet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No income sources added yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-green-500" />
              Savings Allocations
            </h2>
            {activeSavings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSavings.map((allocation) => (
                  <SavingsCard 
                    key={allocation.id} 
                    allocation={allocation} 
                    account={getAccountForId(allocation.accountId)}
                    accounts={accounts}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-8">
                <CardContent className="text-center">
                  <PiggyBank className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No savings allocations added yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
