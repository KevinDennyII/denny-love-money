import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { type SavingsAllocation, type Account } from "@shared/schema";
import { SavingsCard } from "./savings-card";
import { motion, AnimatePresence } from "framer-motion";

export function SavingsCategory({ title, icon, allocations, accounts, getAccount }: { 
  title: string; 
  icon: React.ReactNode; 
  allocations: SavingsAllocation[]; 
  accounts: Account[];
  getAccount: (id: string | null | undefined) => Account | undefined;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (allocations.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              {icon}
              {title}
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-auto ${isOpen ? "" : "-rotate-90"}`} />
            </h2>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-4">
        <AnimatePresence>
          {allocations.map((allocation) => (
            <SavingsCard 
              key={allocation.id} 
              allocation={allocation} 
              account={getAccount(allocation.accountId)}
              accounts={accounts}
            />
          ))}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
