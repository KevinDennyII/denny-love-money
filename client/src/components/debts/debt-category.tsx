import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { type Debt } from "@shared/schema";
import { DebtCard } from "./debt-card";

export function DebtCategory({ title, icon, debts }: { title: string, icon: React.ReactNode, debts: Debt[] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (debts.length === 0) return null;

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
        {debts.map((debt) => (
          <DebtCard key={debt.id} debt={debt} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
