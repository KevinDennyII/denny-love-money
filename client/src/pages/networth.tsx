import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Plus, TrendingUp, TrendingDown, Building, Car, Briefcase, PiggyBank, Coins, Home, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAssetSchema, type Asset, type InsertAsset, type Debt } from "@shared/schema";
import { OwnerBadge } from "@/components/owner-badge";
import { z } from "zod";

const assetFormSchema = insertAssetSchema.extend({
  value: z.string().min(1, "Value is required"),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Coins,
  vehicle: Car,
  investment: TrendingUp,
  retirement: Briefcase,
  property: Home,
  other: Building,
};

const assetTypeLabels: Record<string, string> = {
  cash: "Cash",
  vehicle: "Vehicle",
  investment: "Investment",
  retirement: "Retirement",
  property: "Property",
  other: "Other",
};

function AssetCard({ asset }: { asset: Asset }) {
  const Icon = assetTypeIcons[asset.assetType] || Building;
  const value = parseFloat(asset.value as string);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all" data-testid={`card-asset-${asset.id}`}>
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
      <div className="text-right">
        <p className="text-lg font-bold text-green-500">{formatCurrency(value)}</p>
        {asset.notes && (
          <p className="text-xs text-muted-foreground max-w-[200px] truncate">{asset.notes}</p>
        )}
      </div>
    </div>
  );
}

function AssetCategory({ title, icon: Icon, assets }: { title: string, icon: any, assets: Asset[] }) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (assets.length === 0) return null;

  const total = assets.reduce((sum, a) => sum + parseFloat(a.value as string), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              <Icon className="h-5 w-5 text-muted-foreground" />
              {title}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({formatCurrency(total)})
              </span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function LiabilityCategory({ title, icon: Icon, debts }: { title: string, icon: any, debts: Debt[] }) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (debts.length === 0) return null;

  const total = debts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              <Icon className="h-5 w-5 text-red-500" />
              {title}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({formatCurrency(total)})
              </span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        {debts.map((debt) => (
          <div key={debt.id} className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all" data-testid={`liability-${debt.id}`}>
            <div>
              <p className="font-medium">{debt.name}</p>
              <p className="text-sm text-muted-foreground">{debt.creditor}</p>
            </div>
            <p className="font-bold text-red-500">{formatCurrency(debt.currentBalance)}</p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function AddAssetDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: "",
      value: "",
      assetType: "cash",
      owner: "Kevin",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertAsset) => {
      return apiRequest('POST', '/api/assets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: "Asset added",
        description: "Your asset has been added to net worth tracking.",
      });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssetFormValues) => {
    mutation.mutate(data as InsertAsset);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-asset">
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>
            Track an asset to include in your net worth calculation.
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
                    <Input placeholder="e.g., Roth IRA" {...field} data-testid="input-asset-name" />
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-asset-value" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-asset-type">
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
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-asset-owner">
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
                    <Textarea placeholder="Optional notes" {...field} value={field.value || ""} data-testid="input-asset-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-asset">
                {mutation.isPending ? "Adding..." : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function NetWorth() {
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  const { data: debts = [], isLoading: debtsLoading } = useQuery<Debt[]>({
    queryKey: ['/api/debts'],
  });

  const isLoading = assetsLoading || debtsLoading;

  const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.value as string), 0);
  const totalDebts = debts.filter(d => !d.isPaidOff).reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);
  const netWorth = totalAssets - totalDebts;

  // Group assets by type
  const cashAssets = assets.filter(a => a.assetType === 'cash');
  const vehicleAssets = assets.filter(a => a.assetType === 'vehicle');
  const investmentAssets = assets.filter(a => a.assetType === 'investment');
  const retirementAssets = assets.filter(a => a.assetType === 'retirement');
  const propertyAssets = assets.filter(a => a.assetType === 'property');
  const otherAssets = assets.filter(a => a.assetType === 'other');

  // Calculate totals by type
  const cashTotal = cashAssets.reduce((sum, a) => sum + parseFloat(a.value as string), 0);
  const vehicleTotal = vehicleAssets.reduce((sum, a) => sum + parseFloat(a.value as string), 0);
  const investmentTotal = investmentAssets.reduce((sum, a) => sum + parseFloat(a.value as string), 0);
  const retirementTotal = retirementAssets.reduce((sum, a) => sum + parseFloat(a.value as string), 0);

  // Group debts by type for display
  const activeDebts = debts.filter(d => !d.isPaidOff);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Net Worth</h1>
          <p className="text-muted-foreground">Track your assets and overall financial health</p>
        </div>
        <AddAssetDialog />
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {netWorth >= 0 ? (
                <TrendingUp className="h-12 w-12 text-green-500" />
              ) : (
                <TrendingDown className="h-12 w-12 text-red-500" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Net Worth</p>
                <p className={`text-4xl font-bold ${netWorth >= 0 ? 'text-green-500' : 'text-red-500'}`} data-testid="text-networth">
                  {formatCurrency(netWorth)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(totalAssets)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Debts</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(totalDebts)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cash</CardDescription>
            <CardTitle className="text-xl text-green-500">{formatCurrency(cashTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vehicles</CardDescription>
            <CardTitle className="text-xl text-green-500">{formatCurrency(vehicleTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Investments</CardDescription>
            <CardTitle className="text-xl text-green-500">{formatCurrency(investmentTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Retirement</CardDescription>
            <CardTitle className="text-xl text-green-500">{formatCurrency(retirementTotal)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
             <div className="space-y-4">
               {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
             </div>
             <div className="space-y-4">
               {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
             </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="h-6 w-6 text-green-500" />
              Assets
            </h2>
            {assets.length > 0 ? (
              <div className="space-y-4">
                <AssetCategory title="Retirement Accounts" icon={Briefcase} assets={retirementAssets} />
                <AssetCategory title="Investments" icon={TrendingUp} assets={investmentAssets} />
                <AssetCategory title="Vehicles" icon={Car} assets={vehicleAssets} />
                <AssetCategory title="Property" icon={Home} assets={propertyAssets} />
                <AssetCategory title="Cash" icon={Coins} assets={cashAssets} />
                <AssetCategory title="Other Assets" icon={Building} assets={otherAssets} />
              </div>
            ) : (
              <Card className="py-8">
                <CardContent className="text-center">
                  <PiggyBank className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No assets tracked yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <TrendingDown className="h-6 w-6 text-red-500" />
              Liabilities
            </h2>
            {activeDebts.length > 0 ? (
              <LiabilityCategory title="Active Debts" icon={Building} debts={activeDebts} />
            ) : (
              <Card className="py-8">
                <CardContent className="text-center">
                  <Building className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No active debts</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
