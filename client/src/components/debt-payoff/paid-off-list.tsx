import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "./utils";
import { Debt } from "@shared/schema";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface PaidOffListProps {
  debts: Debt[];
}

export function PaidOffList({ debts }: PaidOffListProps) {
  if (debts.length === 0) return null;

  return (
    <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10 dark:border-green-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <CardTitle className="text-xl">Paid Off Debts</CardTitle>
        </div>
        <CardDescription>
          Congratulations on clearing these debts! They are excluded from your payoff plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Debt Name</TableHead>
              <TableHead>Creditor</TableHead>
              <TableHead>Original Balance</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {debts.map((debt) => (
                <motion.tr layout key={debt.id}>
                  <TableCell className="font-medium">{debt.name}</TableCell>
                  <TableCell>{debt.creditor}</TableCell>
                  <TableCell>
                    {debt.originalBalance 
                      ? formatCurrency(parseFloat(debt.originalBalance as string))
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Paid Off
                    </span>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
