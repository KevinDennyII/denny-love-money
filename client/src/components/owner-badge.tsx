import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OwnerBadgeProps {
  owner: string;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function OwnerBadge({ owner, className, variant }: OwnerBadgeProps) {
  let display = owner;
  let fullName = owner;
  let emoji = "";

  if (owner === "Kevin") {
    display = "HB";
    fullName = "Honey Bunches (Kevin)";
    emoji = "🍯";
  } else if (owner === "Jamie") {
    display = "SC";
    fullName = "Strawberry Cupcake (Jamie)";
    emoji = "🍓";
  }

  // If it's Joint or something else, just show it as is
  if (owner !== "Kevin" && owner !== "Jamie") {
    return (
      <Badge variant={variant || "outline"} className={className}>
        {owner}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant || (owner === "Kevin" ? "default" : "secondary")} 
            className={cn("cursor-help", className)}
          >
            {emoji} {display}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fullName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
