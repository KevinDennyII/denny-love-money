import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Building } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Asset, type InsertAsset } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import { OwnerBadge } from "@/components/owner-badge";
import { assetFormSchema, type AssetFormValues, assetTypeIcons, assetTypeLabels } from "./schemas";
import { motion } from "framer-motion";

export function EditAssetDialog({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const { toast } = useToast();
  const { readOnly } = useAuth();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: asset.name,
      value: asset.value?.toString() || "0",
      assetType: asset.assetType,
      owner: asset.owner,
      notes: asset.notes || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertAsset>) => {
      return apiRequest('PATCH', `/api/assets/${asset.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: "Asset updated",
        description: "Your asset has been updated successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/assets/${asset.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: "Asset deleted",
        description: "Your asset has been removed.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssetFormValues) => {
    updateMutation.mutate(data as InsertAsset);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Asset</DialogTitle>
        <DialogDescription>
          Update your asset details.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Roth IRA" {...field} data-testid="input-edit-asset-name" disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-edit-asset-value" disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-asset-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="retirement">Retirement</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="owner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={readOnly}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-asset-owner">
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
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional notes about this asset" {...field} value={field.value || ""} data-testid="input-edit-asset-notes" disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="flex justify-between gap-2">
            {!readOnly && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-asset"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button type="submit" disabled={updateMutation.isPending || readOnly} data-testid="button-save-asset">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

export function AssetCard({ asset }: { asset: Asset }) {
  const [editOpen, setEditOpen] = useState(false);
  const { readOnly } = useAuth();
  const Icon = assetTypeIcons[asset.assetType] || Building;
  const value = parseFloat(asset.value as string);

  return (
    <motion.div layout>
      <div 
        className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all group"
        data-testid={`card-asset-${asset.id}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">{asset.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-normal">
                {assetTypeLabels[asset.assetType]}
              </Badge>
              {asset.owner && (
                <OwnerBadge owner={asset.owner} variant={asset.owner === 'Kevin' ? 'default' : asset.owner === 'Jamie' ? 'secondary' : 'outline'} />
              )}
            </div>
            {asset.lastUpdated && (
              <div className="text-xs text-muted-foreground mt-1">
                Updated: {new Date(asset.lastUpdated).toLocaleDateString()} {new Date(asset.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-green-500">{formatCurrency(value)}</p>
            {asset.notes && (
              <p className="text-xs text-muted-foreground max-w-[200px] truncate">{asset.notes}</p>
            )}
          </div>
          {!readOnly && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditOpen(true)}
              data-testid={`button-edit-asset-${asset.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditAssetDialog asset={asset} onClose={() => setEditOpen(false)} />
      </Dialog>
    </motion.div>
  );
}
