import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { CheckCircle2 } from "lucide-react";
import { type MedicalBill, type HsaPayback } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

import { MedicalBillCard } from "@/components/medical/medical-bill-card";
import { HsaPaybackCard } from "@/components/medical/hsa-payback-card";
import { AddMedicalBillDialog } from "@/components/medical/add-medical-bill-dialog";
import { AddHsaDialog } from "@/components/medical/add-hsa-dialog";

export default function Medical() {
  const { data: medicalBills = [], isLoading: billsLoading } = useQuery<MedicalBill[]>({
    queryKey: ['/api/medical-bills'],
  });

  const { data: hsaPaybacks = [], isLoading: hsaLoading } = useQuery<HsaPayback[]>({
    queryKey: ['/api/hsa-paybacks'],
  });

  // Sort by year ascending (oldest first)
  const sortedHsaPaybacks = [...hsaPaybacks].sort((a, b) => a.year - b.year);

  const activeBills = medicalBills.filter(b => !b.isPaidOff);
  const paidBills = medicalBills.filter(b => b.isPaidOff);
  const totalMedicalDebt = activeBills.reduce((sum, b) => sum + parseFloat(b.amountRemaining as string), 0);

  const unpaidHsa = sortedHsaPaybacks.filter(h => !h.isPaid);
  const paidHsa = sortedHsaPaybacks.filter(h => h.isPaid);
  const totalHsaPending = unpaidHsa.reduce((sum, h) => sum + parseFloat(h.amount as string), 0);
  const totalHsaPaid = paidHsa.reduce((sum, h) => sum + parseFloat(h.amount as string), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Medical & HSA</h1>
          <p className="text-muted-foreground">Track medical bills and HSA reimbursements</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AddHsaDialog />
          <AddMedicalBillDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Medical Debt</CardDescription>
            <CardTitle className="text-2xl text-red-500" data-testid="text-medical-debt">
              {formatCurrency(totalMedicalDebt)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{activeBills.length} active bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>HSA To Claim</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-hsa-pending">
              {formatCurrency(totalHsaPending)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{unpaidHsa.length} pending items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>HSA Reimbursed</CardDescription>
            <CardTitle className="text-2xl text-green-500" data-testid="text-hsa-paid">
              {formatCurrency(totalHsaPaid)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{paidHsa.length} reimbursed items</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="medical" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="medical" data-testid="tab-medical">Medical Bills</TabsTrigger>
          <TabsTrigger value="hsa" data-testid="tab-hsa">HSA Paybacks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="medical" className="space-y-6 mt-6">
          {billsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Active Bills</h2>
                {activeBills.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                      {activeBills.map((bill) => (
                        <motion.div
                          key={bill.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          layout
                        >
                          <MedicalBillCard bill={bill} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                      <CheckCircle2 className="h-10 w-10 text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">No Active Medical Bills</h3>
                      <p className="text-muted-foreground">Great job! You have no outstanding medical debt.</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {paidBills.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Paid Off</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                    {paidBills.map((bill) => (
                      <MedicalBillCard key={bill.id} bill={bill} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hsa" className="mt-6">
          {hsaLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Reimbursement</CardTitle>
                  <CardDescription>{formatCurrency(totalHsaPending)} to claim</CardDescription>
                </CardHeader>
                <CardContent>
                  {unpaidHsa.length > 0 ? (
                    <div className="divide-y divide-border">
                      <AnimatePresence initial={false}>
                        {unpaidHsa.map((payback) => (
                          <motion.div
                            key={payback.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <HsaPaybackCard payback={payback} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending reimbursements</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">Claimed</CardTitle>
                  </div>
                  <CardDescription>{formatCurrency(totalHsaPaid)} reimbursed</CardDescription>
                </CardHeader>
                <CardContent>
                  {paidHsa.length > 0 ? (
                    <div className="divide-y divide-border max-h-80 overflow-y-auto">
                      <AnimatePresence initial={false}>
                        {paidHsa.map((payback) => (
                          <motion.div
                            key={payback.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <HsaPaybackCard payback={payback} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No claimed reimbursements yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
