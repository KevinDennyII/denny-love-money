import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Building, Car, Briefcase, PiggyBank, Coins, Home } from "lucide-react";
import { type Asset, type Debt } from "@shared/schema";
import { AddAssetDialog } from "@/components/networth/add-asset-dialog";
import { AssetCategory, LiabilityCategory } from "@/components/networth/asset-category";

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
