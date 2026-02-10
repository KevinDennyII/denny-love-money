import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getDebtPayoffProgress } from "@/lib/formatters";
import { CreditCard, Landmark, ShoppingBag, CheckCircle2 } from "lucide-react";
import { type Debt } from "@shared/schema";
import { AddDebtDialog } from "@/components/debts/add-debt-dialog";
import { DebtCategory } from "@/components/debts/debt-category";

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

  const totalPaidDown = debts.reduce((sum, d) => {
    const current = parseFloat(d.currentBalance as string || '0');
    const original = d.originalBalance 
      ? parseFloat(d.originalBalance as string) 
      : current;
    return sum + Math.max(0, original - current);
  }, 0);

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
            <CardDescription>Total Paid Down</CardDescription>
            <CardTitle className="text-2xl text-green-500">{formatCurrency(totalPaidDown)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Principal paid off</p>
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
