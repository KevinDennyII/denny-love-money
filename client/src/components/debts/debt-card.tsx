import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, getDebtPayoffProgress } from "@/lib/formatters";
import { CheckCircle2, Pencil, CreditCard } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Debt, type InsertDebt } from "@shared/schema";
import { OwnerBadge } from "@/components/owner-badge";
import { debtFormSchema, type DebtFormValues, debtTypeIcons, debtTypeLabels } from "./schemas";

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

export function DebtCard({ debt }: { debt: Debt }) {
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
            <div className="flex justify-between items-center mt-1.5">
               <p className="text-xs text-muted-foreground">
                  Paid: <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(Math.max(0, original - balance))}</span>
               </p>
               {debt.minimumPayment && (
                <p className="text-xs text-muted-foreground">
                  Min: <span className="font-medium">{formatCurrency(minimumPayment)}</span>
                </p>
               )}
            </div>
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
