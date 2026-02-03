import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Stethoscope } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { type MedicalBill } from "@shared/schema";

export function MedicalBillCard({ bill }: { bill: MedicalBill }) {
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
