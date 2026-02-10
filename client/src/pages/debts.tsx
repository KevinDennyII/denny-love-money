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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency, getDebtPayoffProgress } from "@/lib/formatters";
import { Plus, CreditCard, Landmark, ShoppingBag, Car, GraduationCap, CheckCircle2, Pencil, ChevronDown } from "lucide-react";
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
    // Sanitize empty strings to null for optional numeric fields
    const sanitizedData = {
      ...data,
      originalBalance: data.originalBalance === "" ? null : data.originalBalance,
      minimumPayment: data.minimumPayment === "" ? null : data.minimumPayment,
      interestRate: data.interestRate === "" ? null : data.interestRate,
    };
    updateMutation.mutate(sanitizedData as unknown as InsertDebt);
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

function DebtCategory({ title, icon, debts }: { title: string, icon: React.ReactNode, debts: Debt[] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (debts.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              {icon}
              {title}
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-4">
        {debts.map((debt) => (
          <DebtCard key={debt.id} debt={debt} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function DebtCard({ debt }: { debt: Debt }) {
  const [editOpen, setEditOpen] = useState(false);
  const Icon = debtTypeIcons[debt.debtType] || CreditCard;
  const balance = parseFloat(debt.currentBalance as string);
  const original = debt.originalBalance ? parseFloat(debt.originalBalance as string) : balance;
  const progress = getDebtPayoffProgress(balance, original);
  const minimumPayment = debt.minimumPayment ? parseFloat(debt.minimumPayment as string) : null;

  return (
    <>
      <div 
        className={`group flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all ${debt.isPaidOff ? 'opacity-60 bg-muted/30' : ''}`}
        data-testid={`card-debt-${debt.id}`}
      >
        {/* Left: Icon and Info */}
        <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${debt.isPaidOff ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            {debt.isPaidOff ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{debt.name}</h3>
              <OwnerBadge owner={debt.owner} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{debt.creditor}</span>
              {!debt.isPaidOff && (
                <>
                  <span>•</span>
                  <span>{debtTypeLabels[debt.debtType]}</span>
                </>
              )}
            </div>
            {debt.lastUpdated && (
              <div className="text-xs text-muted-foreground mt-1">
                Updated: {new Date(debt.lastUpdated).toLocaleDateString()} {new Date(debt.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Middle: Progress (Hidden on mobile if needed, or stacked) */}
        {!debt.isPaidOff && (
          <div className="flex-1 w-full sm:px-8 mb-4 sm:mb-0">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Payoff Progress</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2.5 w-full" />
            {debt.minimumPayment && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Min Payment: <span className="font-medium">{formatCurrency(minimumPayment)}</span>
              </p>
            )}
          </div>
        )}

        {/* Right: Balance & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
          <div className="text-right">
             <div className={`text-xl font-bold ${debt.isPaidOff ? 'text-green-500 line-through decoration-2' : 'text-red-500'}`}>
              {formatCurrency(balance)}
            </div>
            {debt.interestRate && parseFloat(debt.interestRate as string) > 0 && !debt.isPaidOff && (
              <p className="text-xs text-muted-foreground">
                {parseFloat(debt.interestRate as string)}% APR
              </p>
            )}
          </div>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditOpen(true)}
            data-testid={`button-edit-debt-${debt.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>
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
    // Sanitize empty strings to null for optional numeric fields
    const sanitizedData = {
      ...data,
      originalBalance: data.originalBalance === "" ? null : data.originalBalance,
      minimumPayment: data.minimumPayment === "" ? null : data.minimumPayment,
      interestRate: data.interestRate === "" ? null : data.interestRate,
    };
    mutation.mutate(sanitizedData as unknown as InsertDebt);
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
  const paidOffDebts = debts
    .filter(d => d.isPaidOff)
    .sort((a, b) => {
      const progA = getDebtPayoffProgress(a.currentBalance, a.originalBalance);
      const progB = getDebtPayoffProgress(b.currentBalance, b.originalBalance);
      return progB - progA;
    });

  const totalDebt = activeDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);
  const totalPaidOff = paidOffDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);

  const kevinDebts = activeDebts.filter(d => d.owner === 'Kevin');
  const jamieDebts = activeDebts.filter(d => d.owner === 'Jamie');

  const kevinTotal = kevinDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);
  const jamieTotal = jamieDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);

  const sortByProgress = (a: Debt, b: Debt) => {
    const progA = getDebtPayoffProgress(a.currentBalance, a.originalBalance);
    const progB = getDebtPayoffProgress(b.currentBalance, b.originalBalance);
    return progB - progA;
  };

  const creditCards = activeDebts
    .filter(d => d.debtType === 'credit_card')
    .sort(sortByProgress);

  const payLaters = activeDebts
    .filter(d => d.debtType === 'pay_later')
    .sort(sortByProgress);

  const loans = activeDebts
    .filter(d => d.debtType === 'auto_loan' || d.debtType === 'student_loan' || d.debtType === 'other')
    .sort(sortByProgress);

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
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="hidden sm:block flex-1 px-8">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <DebtCategory 
            title="Credit Cards" 
            icon={<CreditCard className="h-5 w-5" />} 
            debts={creditCards} 
          />
          <DebtCategory 
            title="Pay Later Services" 
            icon={<ShoppingBag className="h-5 w-5" />} 
            debts={payLaters} 
          />
          <DebtCategory 
            title="Loans" 
            icon={<Landmark className="h-5 w-5" />} 
            debts={loans} 
          />
          <DebtCategory 
            title="Paid Off" 
            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} 
            debts={paidOffDebts} 
          />
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
