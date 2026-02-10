import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Stethoscope, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type MedicalBill } from "@shared/schema";
import { MedicalBillCard } from "./medical-bill-card";

export function MedicalBillCategory({ title, bills, defaultOpen }: { title: string, bills: MedicalBill[], defaultOpen: boolean }) {
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
