import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/formatters";
import { type Asset, type Debt } from "@shared/schema";
import { AssetCard } from "./asset-card";
import { motion, AnimatePresence } from "framer-motion";

export function AssetCategory({ title, icon: Icon, assets }: { title: string, icon: any, assets: Asset[] }) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (assets.length === 0) return null;

  const total = assets.reduce((sum, a) => sum + parseFloat(a.value as string), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              <Icon className="h-5 w-5 text-muted-foreground" />
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
        <AnimatePresence>
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function LiabilityCategory({ title, icon: Icon, debts }: { title: string, icon: any, debts: Debt[] }) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (debts.length === 0) return null;

  const total = debts.reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent h-auto group">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full">
              <Icon className="h-5 w-5 text-red-500" />
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
        {debts.map((debt) => (
          <div key={debt.id} className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all" data-testid={`liability-${debt.id}`}>
            <div>
              <p className="font-medium">{debt.name}</p>
              <p className="text-sm text-muted-foreground">{debt.creditor}</p>
            </div>
            <p className="font-bold text-red-500">{formatCurrency(debt.currentBalance)}</p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
