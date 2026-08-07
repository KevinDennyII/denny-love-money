import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  PiggyBank,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import {
  Wallet,
  Stethoscope,
  TrendingUp,
  Calculator,
  Lock,
  Settings,
} from "lucide-react";

const primaryTabs = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Budget", url: "/budget", icon: Receipt },
  { title: "Debts", url: "/debts", icon: CreditCard },
  { title: "Savings", url: "/savings", icon: PiggyBank },
] as const;

const moreItems = [
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Debt Payoff", url: "/debt-payoff", icon: Calculator },
  { title: "Privacy Cards", url: "/privacy-transactions", icon: Lock },
  { title: "Medical & HSA", url: "/medical", icon: Stethoscope },
  { title: "Net Worth", url: "/networth", icon: TrendingUp },
] as const;

/**
 * Thumb-friendly bottom navigation for phones (Monarch / YNAB pattern).
 * Hidden from md and up where the sidebar takes over.
 */
export function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some((item) => location === item.url)
    || location === "/settings";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="grid grid-cols-5 h-16">
        {primaryTabs.map((tab) => {
          const active = location === tab.url;
          return (
            <Link
              key={tab.url}
              href={tab.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`mobile-nav-${tab.title.toLowerCase()}`}
            >
              <tab.icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
              <span>{tab.title}</span>
            </Link>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition-colors",
                isMoreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="mobile-nav-more"
            >
              <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "stroke-[2.25]")} />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
            <SheetHeader>
              <SheetTitle className="text-left">More</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid gap-1">
              {moreItems.map((item) => {
                const active = location === item.url;
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
              {user?.role === "admin" && (
                <Link
                  href="/settings"
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors",
                    location === "/settings"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  <span>Settings</span>
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
