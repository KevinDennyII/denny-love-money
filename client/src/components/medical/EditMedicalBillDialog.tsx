import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type MedicalBill, type InsertMedicalBill } from "@shared/schema";
import { medicalBillFormSchema, type MedicalBillFormValues } from "./schemas";
import { useAuth } from "@/hooks/use-auth";
import { Pencil } from "lucide-react";
import { useState } from "react";

export function EditMedicalBillDialog({ bill }: { bill: MedicalBill }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { readOnly } = useAuth();

  const form = useForm<MedicalBillFormValues>({
    resolver: zodResolver(medicalBillFormSchema),
    defaultValues: {
      billName: bill.billName,
      provider: bill.provider || "",
      totalAmount: bill.totalAmount?.toString(),
      amountRemaining: bill.amountRemaining?.toString(),
      monthlyPayment: bill.monthlyPayment?.toString(),
      paymentDay: bill.paymentDay,
      referenceNumber: bill.referenceNumber || "",
      isPaidOff: bill.isPaidOff,
      notes: bill.notes || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertMedicalBill>) => {
      return apiRequest('PATCH', `/api/medical-bills/${bill.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-bills'] });
      toast({
        title: "Medical bill updated",
        description: "The medical bill has been updated.",
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update medical bill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/medical-bills/${bill.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-bills'] });
      toast({
        title: "Medical bill deleted",
        description: "The medical bill has been removed.",
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete medical bill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MedicalBillFormValues) => {
    updateMutation.mutate(data as InsertMedicalBill);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={readOnly}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Medical Bill</DialogTitle>
          <DialogDescription>Update this medical bill.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Form fields... */}
            <DialogFooter className="flex justify-between">
              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button type="submit" disabled={updateMutation.isPending || readOnly}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
