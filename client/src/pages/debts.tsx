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
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency, getDebtPayoffProgress } from "@/lib/formatters";
import { Plus, CreditCard, Landmark, ShoppingBag, Car, GraduationCap, CheckCircle2, Pencil } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertDebtSchema, type Debt, type InsertDebt } from "@shared/schema";
import { OwnerBadge } from "@/components/owner-badge";
import { z } from "zod";

const debtFormSchema = insertDebtSchema.extend({
  currentBalance: z.string().min(1, "Balance is required"),
  originalBalance: z.string().optional(),
  minimumPayment: z.string().optional(),
  interestRate: z.string().optional(),
});

type DebtFormValues = z.infer<typeof debtFormSchema>;

const debtTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  credit_card: CreditCard,
  pay_later: ShoppingBag,
  auto_loan: Car,
  student_loan: GraduationCap,
  other: Landmark,
};

const debtTypeLabels: Record<string, string> = {
  credit_card: "Credit Card",
  pay_later: "Pay Later",
  auto_loan: "Auto Loan",
  student_loan: "Student Loan",
  other: "Other",
};

function EditDebtDialog({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const { toast } = useToast();

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      name: debt.name,
      creditor: debt.creditor,
      debtType: debt.debtType,
      currentBalance: debt.currentBalance?.toString() || "0",
      originalBalance: debt.originalBalance?.toString() || "",
      minimumPayment: debt.minimumPayment?.toString() || "",
      interestRate: debt.interestRate?.toString() || "",
      dueDay: debt.dueDay || undefined,
      owner: debt.owner,
      notes: debt.notes || "",
      isPaidOff: debt.isPaidOff,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertDebt>) => {
      return apiRequest('PATCH', `/api/debts/${debt.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debts'] });
      toast({
        title: "Debt updated",
        description: "Your debt has been updated successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update debt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/debts/${debt.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debts'] });
      toast({
        title: "Debt deleted",
        description: "Your debt has been removed.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete debt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DebtFormValues) => {
    updateMutation.mutate(data as InsertDebt);
  };

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Debt</DialogTitle>
        <DialogDescription>
          Update your debt details or mark as paid off.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Debt Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., USAA Visa" {...field} data-testid="input-edit-debt-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="creditor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Creditor</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., USAA, Navy Federal" {...field} data-testid="input-edit-creditor" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="debtType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-debt-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="pay_later">Pay Later</SelectItem>
                      <SelectItem value="auto_loan">Auto Loan</SelectItem>
                      <SelectItem value="student_loan">Student Loan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                      <SelectTrigger data-testid="select-edit-debt-owner">
                        <SelectValue placeholder="Select" />
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
                  <FormLabel>Current Balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-current-balance" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originalBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Optional" {...field} data-testid="input-edit-original-balance" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="minimumPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Payment</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-min-payment" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>APR %</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-apr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Day</FormLabel>
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
          </div>
          <FormField
            control={form.control}
            name="isPaidOff"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Paid Off</FormLabel>
                  <p className="text-sm text-muted-foreground">Mark this debt as fully paid</p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-paid-off"
                  />
                </FormControl>
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
                  <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-edit-debt-notes" />
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
              data-testid="button-delete-debt"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-debt">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

function DebtCard({ debt }: { debt: Debt }) {
  const [editOpen, setEditOpen] = useState(false);
  const Icon = debtTypeIcons[debt.debtType] || CreditCard;
  const balance = parseFloat(debt.currentBalance as string);
  const original = debt.originalBalance ? parseFloat(debt.originalBalance as string) : balance;
  const progress = getDebtPayoffProgress(balance, original);
  const paidAmount = original - balance;
  const minimumPayment = debt.minimumPayment ? parseFloat(debt.minimumPayment as string) : null;

  return (
    <>
      <Card className={`hover-elevate ${debt.isPaidOff ? 'opacity-60' : ''}`} data-testid={`card-debt-${debt.id}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${debt.isPaidOff ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {debt.isPaidOff ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{debt.name}</h3>
                <p className="text-sm text-muted-foreground">{debt.creditor}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${debt.isPaidOff ? 'text-green-500 line-through' : 'text-red-500'}`}>
                {formatCurrency(balance)}
              </p>
              <Badge variant={debt.isPaidOff ? "default" : "secondary"} className="mt-1">
                {debt.isPaidOff ? "Paid Off" : debtTypeLabels[debt.debtType]}
              </Badge>
            </div>
          </div>
          
          {!debt.isPaidOff && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid Off</span>
                <span className="font-medium">
                  {debt.originalBalance ? (
                    <>{formatCurrency(paidAmount)} <span className="text-muted-foreground">({progress.toFixed(0)}%)</span></>
                  ) : (
                    <span className="text-xs text-muted-foreground">Set original balance to track</span>
                  )}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={debt.owner === 'Kevin' ? 'default' : 'secondary'}>
                {debt.owner}
              </Badge>
              {minimumPayment && (
                <Badge variant="outline">
                  Min: {formatCurrency(minimumPayment)}
                </Badge>
              )}
              {debt.dueDay && (
                <Badge variant="outline">
                  Due: {debt.dueDay}{debt.dueDay === 1 ? 'st' : debt.dueDay === 2 ? 'nd' : debt.dueDay === 3 ? 'rd' : 'th'}
                </Badge>
              )}
              {debt.interestRate && parseFloat(debt.interestRate as string) > 0 && (
                <Badge variant="outline">
                  {parseFloat(debt.interestRate as string).toFixed(1)}% APR
                </Badge>
              )}
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setEditOpen(true)}
              data-testid={`button-edit-debt-${debt.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          {debt.notes && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{debt.notes}</p>
          )}
          {debt.lastUpdated && (
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated: {new Date(debt.lastUpdated).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditDebtDialog debt={debt} onClose={() => setEditOpen(false)} />
      </Dialog>
    </>
  );
}

function AddDebtDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      name: "",
      creditor: "",
      debtType: "credit_card",
      currentBalance: "",
      originalBalance: "",
      minimumPayment: "",
      interestRate: "",
      dueDay: undefined,
      owner: "Kevin",
      notes: "",
      isPaidOff: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertDebt) => {
      return apiRequest('POST', '/api/debts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debts'] });
      toast({
        title: "Debt added",
        description: "Your debt has been added to tracking.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add debt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DebtFormValues) => {
    mutation.mutate(data as InsertDebt);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-debt">
          <Plus className="h-4 w-4 mr-2" />
          Add Debt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Debt</DialogTitle>
          <DialogDescription>
            Track a new credit card, loan, or pay later balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debt Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., USAA Visa" {...field} data-testid="input-debt-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creditor</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., USAA, Navy Federal" {...field} data-testid="input-creditor" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="debtType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-debt-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="pay_later">Pay Later</SelectItem>
                        <SelectItem value="auto_loan">Auto Loan</SelectItem>
                        <SelectItem value="student_loan">Student Loan</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                        <SelectTrigger data-testid="select-debt-owner">
                          <SelectValue placeholder="Select" />
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
                    <FormLabel>Current Balance</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-current-balance" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="originalBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Balance</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Optional" {...field} data-testid="input-original-balance" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="minimumPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Payment</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-min-payment" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>APR %</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-apr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Day</FormLabel>
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
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-debt-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-debt">
                {mutation.isPending ? "Adding..." : "Add Debt"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Debts() {
  const { data: debts = [], isLoading } = useQuery<Debt[]>({
    queryKey: ['/api/debts'],
  });

  const activeDebts = debts.filter(d => !d.isPaidOff);
  const paidOffDebts = debts.filter(d => d.isPaidOff);
  const totalDebt = activeDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);
  const totalPaidOff = paidOffDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);

  const kevinDebts = activeDebts.filter(d => d.owner === 'Kevin');
  const jamieDebts = activeDebts.filter(d => d.owner === 'Jamie');

  const kevinTotal = kevinDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);
  const jamieTotal = jamieDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);

  const creditCards = activeDebts.filter(d => d.debtType === 'credit_card');
  const payLaters = activeDebts.filter(d => d.debtType === 'pay_later');
  const loans = activeDebts.filter(d => d.debtType === 'auto_loan' || d.debtType === 'student_loan' || d.debtType === 'other');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Debts</h1>
          <p className="text-muted-foreground">Track and pay down your debts</p>
        </div>
        <AddDebtDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Debt</CardDescription>
            <CardTitle className="text-2xl text-red-500" data-testid="text-total-debt">
              {formatCurrency(totalDebt)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{activeDebts.length} active debts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>HB's Debt</CardDescription>
            <CardTitle className="text-2xl text-red-500">{formatCurrency(kevinTotal)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{kevinDebts.length} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>SC's Debt</CardDescription>
            <CardTitle className="text-2xl text-red-500">{formatCurrency(jamieTotal)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{jamieDebts.length} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid Off</CardDescription>
            <CardTitle className="text-2xl text-green-500">{formatCurrency(totalPaidOff)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{paidOffDebts.length} debts cleared</p>
          </CardContent>
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
          {creditCards.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Credit Cards
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {creditCards.map((debt) => (
                  <DebtCard key={debt.id} debt={debt} />
                ))}
              </div>
            </div>
          )}
          {payLaters.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Pay Later Services
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {payLaters.map((debt) => (
                  <DebtCard key={debt.id} debt={debt} />
                ))}
              </div>
            </div>
          )}
          {loans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Loans
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loans.map((debt) => (
                  <DebtCard key={debt.id} debt={debt} />
                ))}
              </div>
            </div>
          )}
          {paidOffDebts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Paid Off
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paidOffDebts.map((debt) => (
                  <DebtCard key={debt.id} debt={debt} />
                ))}
              </div>
            </div>
          )}
          {debts.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No debts tracked</h3>
                <p className="text-muted-foreground mb-4">Start tracking your debts to monitor your payoff progress.</p>
                <AddDebtDialog />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
