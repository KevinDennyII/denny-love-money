import { z } from "zod";
import { insertAssetSchema } from "@shared/schema";
import { Coins, Car, TrendingUp, Briefcase, Home, Building } from "lucide-react";

export const assetFormSchema = insertAssetSchema.extend({
  value: z.string().min(1, "Value is required"),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;

export const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Coins,
  vehicle: Car,
  investment: TrendingUp,
  retirement: Briefcase,
  property: Home,
  other: Building,
};

export const assetTypeLabels: Record<string, string> = {
  cash: "Cash",
  vehicle: "Vehicle",
  investment: "Investment",
  retirement: "Retirement",
  property: "Property",
  other: "Other",
};
