import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type InsertDebt } from "@shared/schema";
import { debtFormSchema, type DebtFormValues } from "./schemas";

export function AddDebtDialog() {
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
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-debt">
              {mutation.isPending ? "Adding..." : "Add Debt"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
