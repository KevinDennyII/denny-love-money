import { insertMedicalBillSchema, insertHsaPaybackSchema } from "@shared/schema";
import { z } from "zod";

export const medicalBillFormSchema = insertMedicalBillSchema.extend({
  totalAmount: z.string().min(1, "Amount is required"),
  amountRemaining: z.string().min(1, "Remaining amount is required"),
  monthlyPayment: z.string().optional(),
});

export const hsaFormSchema = insertHsaPaybackSchema.extend({
  amount: z.string().min(1, "Amount is required"),
  year: z.string().min(1, "Year is required"),
});

export type MedicalBillFormValues = z.infer<typeof medicalBillFormSchema>;
export type HsaFormValues = z.infer<typeof hsaFormSchema>;
