import { insertSavingsAllocationSchema, insertIncomeSchema } from "@shared/schema";
import { z } from "zod";

export const savingsFormSchema = insertSavingsAllocationSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

export const incomeFormSchema = insertIncomeSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

export type SavingsFormValues = z.infer<typeof savingsFormSchema>;
export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
