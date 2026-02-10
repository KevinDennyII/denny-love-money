import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Clock, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { type HsaPayback } from "@shared/schema";
import { HsaPaybackCard } from "./hsa-payback-card";

export function HsaCategory({ title, paybacks, defaultOpen, type }: { title: string, paybacks: HsaPayback[], defaultOpen: boolean, type: 'pending' | 'paid' }) {
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
