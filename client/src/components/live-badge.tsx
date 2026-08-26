import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * BankSync “live data” marker.
 * Glow uses box-shadow (not filters); icon pulse uses opacity/transform
 * (Comeau CSS for JS Devs — keep motion cheap; honor prefers-reduced-motion).
 */
export function LiveBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("live-badge gap-1 text-[10px] shrink-0 font-semibold", className)}
      data-testid="badge-live"
    >
      <Radio className="live-badge-icon h-3 w-3" aria-hidden />
      Live
    </Badge>
  );
}
