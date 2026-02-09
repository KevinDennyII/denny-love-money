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
    <div 
      className={`group flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all ${bill.isPaidOff ? 'opacity-60' : ''}`} 
      data-testid={`card-medical-${bill.id}`}
    >
      {/* Left: Icon & Info */}
      <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0 sm:flex-1">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bill.isPaidOff ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
          {bill.isPaidOff ? (
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <Stethoscope className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-lg truncate">{bill.billName}</h3>
          {bill.provider && (
            <p className="text-sm text-muted-foreground truncate">{bill.provider}</p>
          )}
          {bill.notes && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{bill.notes}</p>
          )}
        </div>
      </div>

      {/* Middle: Progress & Details */}
      <div className="flex flex-col w-full sm:w-1/3 px-0 sm:px-4 mb-4 sm:mb-0 gap-2">
        {!bill.isPaidOff && (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Paid: {formatCurrency(paid)}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {monthlyPayment && (
            <Badge variant="outline" className="whitespace-nowrap">
              {formatCurrency(monthlyPayment)}/mo
            </Badge>
          )}
          {bill.paymentDay && (
            <Badge variant="secondary" className="whitespace-nowrap">
              Due: {bill.paymentDay}{bill.paymentDay === 1 ? 'st' : bill.paymentDay === 2 ? 'nd' : bill.paymentDay === 3 ? 'rd' : 'th'}
            </Badge>
          )}
        </div>
      </div>

      {/* Right: Amount */}
      <div className="text-right w-full sm:w-auto shrink-0">
        <div className={`text-xl font-bold ${bill.isPaidOff ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(remaining)}
        </div>
        <div className="text-xs text-muted-foreground">
          remaining of {formatCurrency(total)}
        </div>
      </div>
    </div>
  );
}
