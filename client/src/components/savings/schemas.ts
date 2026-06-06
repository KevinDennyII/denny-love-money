import { insertSavingsAllocationSchema, insertIncomeSchema } from "@shared/schema";
import { z } from "zod";

const optionalAccountIdField = z.preprocess(
  (val) => (val === "" ? null : val),
  z.string().nullable().optional(),
);

export const savingsFormSchema = insertSavingsAllocationSchema.extend({
  amount: z.string().min(1, "Amount is required"),
  accountId: optionalAccountIdField,
});

export const incomeFormSchema = insertIncomeSchema.extend({
  amount: z.string().min(1, "Amount is required"),
  accountId: optionalAccountIdField,
});

export type SavingsFormValues = z.infer<typeof savingsFormSchema>;
export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
