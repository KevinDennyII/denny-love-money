import { z } from "zod";
import { insertExpenseSchema } from "@shared/schema";

export const expenseFormSchema = insertExpenseSchema.extend({
  budgetedAmount: z.string().min(1, "Amount is required"),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
