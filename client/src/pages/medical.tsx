import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { CheckCircle2 } from "lucide-react";
import { type MedicalBill, type HsaPayback } from "@shared/schema";
import { AddMedicalBillDialog } from "@/components/medical/add-medical-bill-dialog";
import { AddHsaDialog } from "@/components/medical/add-hsa-dialog";
import { MedicalBillCategory } from "@/components/medical/medical-bill-category";
import { HsaCategory } from "@/components/medical/hsa-category";

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

  // Group unpaid HSA by year
  const unpaidHsaByYear = unpaidHsa.reduce((acc, payback) => {
    const year = payback.year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(payback);
    return acc;
  }, {} as Record<number, HsaPayback[]>);

  const sortedUnpaidYears = Object.keys(unpaidHsaByYear).map(Number).sort((a, b) => a - b);

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
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                   <div className="flex items-center gap-4">
                     <Skeleton className="h-12 w-12 rounded-full" />
                     <div>
                       <Skeleton className="h-5 w-48 mb-2" />
                       <Skeleton className="h-4 w-32" />
                     </div>
                   </div>
                   <Skeleton className="h-8 w-32" />
                 </div>
               ))}
             </div>
          ) : (
            <div className="space-y-6">
              <MedicalBillCategory 
                title="Active Bills" 
                bills={activeBills} 
                defaultOpen={true}
              />

              {activeBills.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                      <CheckCircle2 className="h-10 w-10 text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">No Active Medical Bills</h3>
                      <p className="text-muted-foreground">Great job! You have no outstanding medical debt.</p>
                    </CardContent>
                  </Card>
              )}

              {paidBills.length > 0 && (
                 <MedicalBillCategory 
                  title="Paid Off" 
                  bills={paidBills} 
                  defaultOpen={false}
                />
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
            <div className="space-y-6">
              <HsaCategory 
                title="Pending Reimbursement" 
                paybacks={unpaidHsa} 
                defaultOpen={true}
                type="pending"
              />

              {unpaidHsa.length === 0 && (
                <Card className="py-8">
                  <CardContent className="text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">All Caught Up!</h3>
                    <p className="text-muted-foreground">No pending HSA reimbursements.</p>
                  </CardContent>
                </Card>
              )}

              <HsaCategory 
                title="Claimed" 
                paybacks={paidHsa} 
                defaultOpen={false}
                type="paid"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
