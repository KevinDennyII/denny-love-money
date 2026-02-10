import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "./utils";
import { Debt } from "@shared/schema";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AllocationListProps {
  debts: Debt[];
  allocations: Record<string, number>;
  onAllocationChange: (debtId: string, amount: number) => void;
}

export function AllocationList({ debts, allocations, onAllocationChange }: AllocationListProps) {
  const calculateMonthsToPayoff = (debt: Debt, payment: number) => {
    const balance = parseFloat(debt.currentBalance?.toString() || "0");
    const rate = parseFloat(debt.interestRate?.toString() || "0") / 100 / 12;
    
    if (balance <= 0) return 0;
    if (payment <= 0) return Infinity;
    
    // If interest is 0, simple division
    if (rate === 0) return Math.ceil(balance / payment);

    // If payment covers less than interest, infinite
    if (payment <= balance * rate) return Infinity;

    // N = -log(1 - (i * B) / P) / log(1 + i)
    const months = -Math.log(1 - (rate * balance) / payment) / Math.log(1 + rate);
    return Math.ceil(months);
  };

  const sortedDebts = [...debts].sort((a, b) => {
    // Sort by high interest first (Avalanche) or low balance (Snowball)?
    // Let's do Balance Descending for now, or Interest Rate Descending.
    // User didn't specify, but typically High Interest is "efficient".
    const rateA = parseFloat(a.interestRate?.toString() || "0");
    const rateB = parseFloat(b.interestRate?.toString() || "0");
    return rateB - rateA;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Debt Name</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>APR</TableHead>
            <TableHead>Min Payment</TableHead>
            <TableHead className="w-[150px]">Planned Payment</TableHead>
            <TableHead className="text-right">Est. Payoff</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDebts.map((debt) => {
            const balance = parseFloat(debt.currentBalance?.toString() || "0");
            const minPayment = parseFloat(debt.minimumPayment?.toString() || "0");
            const currentAllocation = allocations[debt.id] ?? minPayment;
            const months = calculateMonthsToPayoff(debt, currentAllocation);
            const isPayable = months !== Infinity;

            return (
              <TableRow key={debt.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{debt.name}</span>
                    <span className="text-xs text-muted-foreground">{debt.creditor}</span>
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(balance)}</TableCell>
                <TableCell>{debt.interestRate}%</TableCell>
                <TableCell>{formatCurrency(minPayment)}</TableCell>
                <TableCell>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={currentAllocation}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onAllocationChange(debt.id, isNaN(val) ? 0 : val);
                      }}
                      className="pl-6 w-full"
                      min={minPayment}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isPayable ? (
                      <span className={months < 12 ? "text-emerald-600 font-bold" : ""}>
                        {months} mo
                        {months > 0 && <span className="text-xs text-muted-foreground block">
                          ({new Date(new Date().setMonth(new Date().getMonth() + months)).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })})
                        </span>}
                      </span>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Payment too low to cover interest!</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
