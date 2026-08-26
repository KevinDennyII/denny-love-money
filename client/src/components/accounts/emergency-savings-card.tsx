import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { apiRequest, queryClient, toErrorMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@shared/schema";
import { CheckCircle2, AlertTriangle, RefreshCw, Shield } from "lucide-react";

type EmergencyStatus = {
  configured: boolean;
  last4: string;
  goal: number;
  balance: number | null;
  met: boolean;
  progressPct: number;
  account: Account | null;
  lastSyncAt: string | null;
};

type BanksyncSyncResponse = {
  success: boolean;
  fetched: number;
  updated: number;
  created: number;
  notes?: string[];
  emergency?: {
    balance: number | null;
    goal: number;
    met: boolean;
  };
};

type Props = {
  /** Compact layout for dashboard */
  compact?: boolean;
  showSyncButton?: boolean;
};

export function EmergencySavingsCard({ compact = false, showSyncButton = true }: Props) {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<EmergencyStatus>({
    queryKey: ["/api/banksync/emergency"],
    staleTime: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/banksync/sync");
      return res.json() as Promise<BanksyncSyncResponse>;
    },
    onMutate: () => {
      toast({
        title: "Syncing USAA via BankSync…",
        description: "Updating checking, savings, and credit balances.",
      });
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/debts"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/assets"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/banksync/emergency"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/banksync/status"] }),
      ]);
      const emergencyNote =
        result.emergency?.balance != null
          ? ` Emergency fund: ${formatCurrency(result.emergency.balance)}.`
          : "";
      toast({
        title: "BankSync complete",
        description: `Updated ${result.updated} balance${result.updated === 1 ? "" : "s"}${
          result.created ? `, created ${result.created}` : ""
        }.${emergencyNote}`,
      });
      if (result.notes?.length) {
        for (const note of result.notes) {
          toast({ title: "Note", description: note });
        }
      }
    },
    onError: (err: unknown) => {
      toast({
        title: "BankSync failed",
        description: toErrorMessage(err, "Could not sync USAA balances"),
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Skeleton className={compact ? "h-28" : "h-40"} />;
  }

  const goal = data?.goal ?? 1500;
  const balance = data?.balance;
  const met = data?.met ?? false;
  const progressPct = data?.progressPct ?? 0;
  const hasBalance = balance != null;

  return (
    <Card data-testid="card-emergency-savings" className={met ? "border-green-500/40" : undefined}>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              Emergency Savings
              {data?.last4 ? (
                <span className="text-muted-foreground">··{data.last4}</span>
              ) : null}
            </CardDescription>
            <CardTitle
              className={`text-2xl tabular-nums ${met ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
              data-testid="text-emergency-balance"
            >
              {hasBalance ? formatCurrency(balance) : "—"}
            </CardTitle>
          </div>
          {showSyncButton ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || data?.configured === false}
              data-testid="button-sync-banksync"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing…" : "Sync USAA"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Goal: keep at least {formatCurrency(goal)}
          </span>
          {hasBalance ? (
            met ? (
              <Badge variant="secondary" className="gap-1 bg-green-500/15 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-3 w-3" />
                On track
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                Below goal
              </Badge>
            )
          ) : (
            <Badge variant="outline">Not synced yet</Badge>
          )}
        </div>
        <Progress
          value={hasBalance ? progressPct : 0}
          indicatorClassName={met ? "bg-green-500" : "bg-amber-500"}
          data-testid="progress-emergency-savings"
        />
        {!compact && (
          <p className="text-xs text-muted-foreground">
            {data?.configured === false
              ? "Add BANKSYNC_API_KEY to enable live USAA balances."
              : data?.account
                ? `${data.account.name} · synced from BankSync`
                : "Sync USAA to pull the emergency fund balance (last4 configured in env)."}
            {data?.lastSyncAt
              ? ` · Last sync ${new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(data.lastSyncAt))}`
              : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
