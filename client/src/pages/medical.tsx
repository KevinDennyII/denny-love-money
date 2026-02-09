import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { CheckCircle2, ChevronDown, Stethoscope, Clock, AlertCircle } from "lucide-react";
import { type MedicalBill, type HsaPayback } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

import { MedicalBillCard } from "@/components/medical/medical-bill-card";
import { HsaPaybackCard } from "@/components/medical/hsa-payback-card";
import { AddMedicalBillDialog } from "@/components/medical/add-medical-bill-dialog";
import { AddHsaDialog } from "@/components/medical/add-hsa-dialog";

function MedicalBillCategory({ title, bills, defaultOpen }: { title: string, bills: MedicalBill[], defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (bills.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              {title === "Active Bills" ? <Stethoscope className="h-5 w-5 text-red-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {title}
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-4">
        <AnimatePresence>
          {bills.map((bill) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              layout
            >
              <MedicalBillCard bill={bill} />
            </motion.div>
          ))}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

function HsaCategory({ title, paybacks, defaultOpen, type }: { title: string, paybacks: HsaPayback[], defaultOpen: boolean, type: 'pending' | 'paid' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (paybacks.length === 0) return null;

  const total = paybacks.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  // Group by year if pending
  const paybacksByYear = type === 'pending' ? paybacks.reduce((acc, p) => {
    const year = p.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(p);
    return acc;
  }, {} as Record<number, HsaPayback[]>) : null;

  const sortedYears = paybacksByYear ? Object.keys(paybacksByYear).map(Number).sort((a, b) => a - b) : [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              {type === 'pending' ? <Clock className="h-5 w-5 text-orange-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {title}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({formatCurrency(total)})
              </span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2 pl-4 border-l-2 border-muted ml-2">
        {type === 'pending' && paybacksByYear ? (
           <div className="space-y-4">
             {sortedYears.map(year => (
               <div key={year} className="space-y-2">
                 <h3 className="text-sm font-medium text-muted-foreground pl-2">{year}</h3>
                 <div className="space-y-2">
                   {paybacksByYear[year].map(payback => (
                     <HsaPaybackCard key={payback.id} payback={payback} />
                   ))}
                 </div>
               </div>
             ))}
           </div>
        ) : (
          <div className="space-y-2">
            {paybacks.map(payback => (
              <HsaPaybackCard key={payback.id} payback={payback} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

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
