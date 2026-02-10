import { z } from "zod";
import { insertAccountSchema } from "@shared/schema";
import { Wallet, PiggyBank, CreditCard, TrendingUp, Landmark } from "lucide-react";

export const accountFormSchema = insertAccountSchema.extend({
  currentBalance: z.string().transform((val) => val || "0"),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const accountTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  loan: Landmark,
};

export const accountTypeLabels: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit Card",
  investment: "Investment",
  loan: "Loan",
};
