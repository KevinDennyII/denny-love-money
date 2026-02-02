import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Stethoscope, Wallet, CheckCircle2, Clock, Receipt } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertMedicalBillSchema, insertHsaPaybackSchema, type MedicalBill, type InsertMedicalBill, type HsaPayback, type InsertHsaPayback } from "@shared/schema";
import { z } from "zod";

const medicalBillFormSchema = insertMedicalBillSchema.extend({
  totalAmount: z.string().min(1, "Amount is required"),
  amountRemaining: z.string().min(1, "Remaining amount is required"),
  monthlyPayment: z.string().optional(),
});

const hsaFormSchema = insertHsaPaybackSchema.extend({
  amount: z.string().min(1, "Amount is required"),
  year: z.string().min(1, "Year is required"),
});

type MedicalBillFormValues = z.infer<typeof medicalBillFormSchema>;
type HsaFormValues = z.infer<typeof hsaFormSchema>;

function MedicalBillCard({ bill }: { bill: MedicalBill }) {
  const total = parseFloat(bill.totalAmount as string);
  const remaining = parseFloat(bill.amountRemaining as string);
  const paid = total - remaining;
  const progress = total > 0 ? (paid / total) * 100 : 0;
  const monthlyPayment = bill.monthlyPayment ? parseFloat(bill.monthlyPayment as string) : null;

  return (
    <Card className={`hover-elevate ${bill.isPaidOff ? 'opacity-60' : ''}`} data-testid={`card-medical-${bill.id}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-md ${bill.isPaidOff ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              {bill.isPaidOff ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Stethoscope className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{bill.billName}</h3>
              {bill.provider && (
                <p className="text-sm text-muted-foreground">{bill.provider}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${bill.isPaidOff ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(remaining)}
            </p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(total)}</p>
          </div>
        </div>

        {!bill.isPaidOff && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {monthlyPayment && (
            <Badge variant="outline">
              {formatCurrency(monthlyPayment)}/mo
            </Badge>
          )}
          {bill.paymentDay && (
            <Badge variant="secondary">
              Due: {bill.paymentDay}{bill.paymentDay === 1 ? 'st' : bill.paymentDay === 2 ? 'nd' : bill.paymentDay === 3 ? 'rd' : 'th'}
            </Badge>
          )}
          {bill.referenceNumber && (
            <Badge variant="outline" className="font-mono text-xs">
              Ref: {bill.referenceNumber}
            </Badge>
          )}
        </div>

        {bill.notes && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{bill.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

function HsaPaybackCard({ payback }: { payback: HsaPayback }) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-border last:border-0 ${payback.isPaid ? 'opacity-60' : ''}`} data-testid={`hsa-item-${payback.id}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${payback.isPaid ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
          {payback.isPaid ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${payback.isPaid ? 'line-through' : ''}`}>{payback.description}</p>
          <p className="text-xs text-muted-foreground">{payback.year}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`font-semibold ${payback.isPaid ? 'text-green-500' : ''}`}>
          {formatCurrency(payback.amount)}
        </span>
      </div>
    </div>
  );
}

function AddMedicalBillDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<MedicalBillFormValues>({
    resolver: zodResolver(medicalBillFormSchema),
    defaultValues: {
      billName: "",
      provider: "",
      totalAmount: "",
      amountRemaining: "",
      monthlyPayment: "",
      paymentDay: undefined,
      referenceNumber: "",
      notes: "",
      isPaidOff: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertMedicalBill) => {
      return apiRequest('POST', '/api/medical-bills', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-bills'] });
      toast({
        title: "Medical bill added",
        description: "Your medical bill has been added to tracking.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add medical bill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MedicalBillFormValues) => {
    mutation.mutate(data as InsertMedicalBill);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-medical-bill">
          <Plus className="h-4 w-4 mr-2" />
          Add Medical Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Medical Bill</DialogTitle>
          <DialogDescription>
            Track a medical bill and its payment progress.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="billName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Methodist Hospital" {...field} data-testid="input-bill-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="Healthcare provider name" {...field} value={field.value || ""} data-testid="input-provider" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-total-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amountRemaining"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remaining</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-remaining" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Payment</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-monthly-payment" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Day</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="1-31"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-payment-day" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Account or reference number" {...field} value={field.value || ""} data-testid="input-reference" />
                  </FormControl>
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
                    <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-medical-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-medical">
                {mutation.isPending ? "Adding..." : "Add Bill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddHsaDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<HsaFormValues>({
    resolver: zodResolver(hsaFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      year: new Date().getFullYear().toString(),
      isPaid: false,
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertHsaPayback) => {
      return apiRequest('POST', '/api/hsa-paybacks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hsa-paybacks'] });
      toast({
        title: "HSA payback added",
        description: "Your HSA reimbursement has been added.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add HSA payback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HsaFormValues) => {
    mutation.mutate({
      ...data,
      year: parseInt(data.year),
    } as InsertHsaPayback);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-hsa">
          <Plus className="h-4 w-4 mr-2" />
          Add HSA Payback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add HSA Payback</DialogTitle>
          <DialogDescription>
            Track an HSA reimbursement you can claim.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Copay for doctor visit" {...field} data-testid="input-hsa-description" />
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-hsa-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" min="2020" max="2030" {...field} data-testid="input-hsa-year" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="cursor-pointer">Already reimbursed?</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-hsa-paid" />
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
                    <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-hsa-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-hsa">
                {mutation.isPending ? "Adding..." : "Add Payback"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Medical() {
  const { data: medicalBills = [], isLoading: billsLoading } = useQuery<MedicalBill[]>({
    queryKey: ['/api/medical-bills'],
  });

  const { data: hsaPaybacks = [], isLoading: hsaLoading } = useQuery<HsaPayback[]>({
    queryKey: ['/api/hsa-paybacks'],
  });

  const activeBills = medicalBills.filter(b => !b.isPaidOff);
  const paidBills = medicalBills.filter(b => b.isPaidOff);
  const totalMedicalDebt = activeBills.reduce((sum, b) => sum + parseFloat(b.amountRemaining as string), 0);

  const unpaidHsa = hsaPaybacks.filter(h => !h.isPaid);
  const paidHsa = hsaPaybacks.filter(h => h.isPaid);
  const totalHsaPending = unpaidHsa.reduce((sum, h) => sum + parseFloat(h.amount as string), 0);
  const totalHsaPaid = paidHsa.reduce((sum, h) => sum + parseFloat(h.amount as string), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Medical & HSA</h1>
          <p className="text-muted-foreground">Track medical bills and HSA reimbursements</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AddHsaDialog />
          <AddMedicalBillDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Medical Debt</CardDescription>
            <CardTitle className="text-2xl text-red-500" data-testid="text-medical-debt">
              {formatCurrency(totalMedicalDebt)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{activeBills.length} active bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>HSA Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-500" data-testid="text-hsa-pending">
              {formatCurrency(totalHsaPending)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{unpaidHsa.length} reimbursements waiting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>HSA Claimed</CardDescription>
            <CardTitle className="text-2xl text-green-500" data-testid="text-hsa-claimed">
              {formatCurrency(totalHsaPaid)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{paidHsa.length} reimbursements completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="medical" className="space-y-4">
        <TabsList>
          <TabsTrigger value="medical" data-testid="tab-medical-bills">
            <Stethoscope className="h-4 w-4 mr-2" />
            Medical Bills
          </TabsTrigger>
          <TabsTrigger value="hsa" data-testid="tab-hsa">
            <Wallet className="h-4 w-4 mr-2" />
            HSA Paybacks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical" className="space-y-4">
          {billsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {activeBills.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeBills.map((bill) => (
                    <MedicalBillCard key={bill.id} bill={bill} />
                  ))}
                </div>
              )}
              {paidBills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Paid Off
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paidBills.map((bill) => (
                      <MedicalBillCard key={bill.id} bill={bill} />
                    ))}
                  </div>
                </div>
              )}
              {medicalBills.length === 0 && (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No medical bills</h3>
                    <p className="text-muted-foreground mb-4">Add medical bills to track your healthcare expenses.</p>
                    <AddMedicalBillDialog />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="hsa" className="space-y-4">
          {hsaLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-lg">Pending Reimbursements</CardTitle>
                  </div>
                  <CardDescription>{formatCurrency(totalHsaPending)} to claim</CardDescription>
                </CardHeader>
                <CardContent>
                  {unpaidHsa.length > 0 ? (
                    <div className="divide-y divide-border">
                      {unpaidHsa.map((payback) => (
                        <HsaPaybackCard key={payback.id} payback={payback} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending reimbursements</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">Claimed</CardTitle>
                  </div>
                  <CardDescription>{formatCurrency(totalHsaPaid)} reimbursed</CardDescription>
                </CardHeader>
                <CardContent>
                  {paidHsa.length > 0 ? (
                    <div className="divide-y divide-border max-h-80 overflow-y-auto">
                      {paidHsa.map((payback) => (
                        <HsaPaybackCard key={payback.id} payback={payback} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No claimed reimbursements yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
