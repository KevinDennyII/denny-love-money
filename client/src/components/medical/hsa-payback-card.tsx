import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency } from "@/lib/formatters";
import { Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type HsaPayback, type InsertHsaPayback } from "@shared/schema";
import { hsaFormSchema, type HsaFormValues } from "./schemas";

export function HsaPaybackCard({ payback }: { payback: HsaPayback }) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm<HsaFormValues>({
    resolver: zodResolver(hsaFormSchema),
    defaultValues: {
      description: payback.description,
      amount: payback.amount.toString(),
      year: payback.year.toString(),
      isPaid: payback.isPaid,
      notes: payback.notes || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertHsaPayback) => {
      return apiRequest('PATCH', `/api/hsa-paybacks/${payback.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hsa-paybacks'] });
      toast({
        title: "Updated",
        description: "HSA payback updated successfully.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update HSA payback.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/hsa-paybacks/${payback.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hsa-paybacks'] });
      toast({
        title: "Deleted",
        description: "HSA payback removed.",
      });
    },
  });

  const onUpdate = (data: HsaFormValues) => {
    updateMutation.mutate({
      ...data,
      amount: data.amount,
      year: parseInt(data.year),
    } as unknown as InsertHsaPayback);
  };

  if (isEditing) {
    return (
      <div className="py-4 border-b border-border last:border-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 rounded-md border p-3 mt-8">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer m-0">Paid?</FormLabel>
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
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

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
          <p className="text-xs text-muted-foreground">{payback.year} {payback.notes && `- ${payback.notes}`}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`font-semibold ${payback.isPaid ? 'text-green-500' : ''}`}>
          {formatCurrency(payback.amount)}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
