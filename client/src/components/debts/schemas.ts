import { insertDebtSchema } from "@shared/schema";
import { z } from "zod";
import { CreditCard, ShoppingBag, Car, GraduationCap, Landmark } from "lucide-react";

export const debtFormSchema = insertDebtSchema.extend({
  currentBalance: z.string().min(1, "Balance is required"),
  originalBalance: z.string().optional(),
  minimumPayment: z.string().optional(),
  interestRate: z.string().optional(),
});

export type DebtFormValues = z.infer<typeof debtFormSchema>;

export const debtTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  credit_card: CreditCard,
  pay_later: ShoppingBag,
  auto_loan: Car,
  student_loan: GraduationCap,
  other: Landmark,
};

export const debtTypeLabels: Record<string, string> = {
  credit_card: "Credit Card",
  pay_later: "Pay Later",
  auto_loan: "Auto Loan",
  student_loan: "Student Loan",
  other: "Other",
};
