import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { apiRequest, queryClient, toErrorMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type PrivacyTransaction } from "@shared/schema";
import { AlertCircle, Lock, RefreshCw } from "lucide-react";

type PrivacyTransactionsResponse = {
  transactions: PrivacyTransaction[];
  total: number;
  limit: number;
};

function formatTxnDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function monthLabel(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
    return "This Month";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(d);
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "SETTLED":
      return "secondary";
    case "VOIDED":
    case "DECLINED":
    case "BOUNCED":
      return "outline";
    case "PENDING":
    case "SETTLING":
      return "default";
    default:
      return "outline";
  }
}

export default function PrivacyTransactions() {
  const { toast } = useToast();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<PrivacyTransactionsResponse>({
    queryKey: ["/api/privacy/transactions"],
    staleTime: 0,
    refetchOnMount: "always",
    // Pick up webhook / server auto-sync while this page is open
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!isError || !error) return;
    toast({
      title: "Could not load Privacy transactions",
      description: toErrorMessage(error),
      variant: "destructive",
    });
  }, [isError, error, toast]);

  // Quiet recent sync every 5 minutes while viewing
  useEffect(() => {
    const quietSync = async () => {
      try {
        await apiRequest("POST", "/api/privacy/sync?mode=recent&days=7");
        await queryClient.invalidateQueries({ queryKey: ["/api/privacy/transactions"] });
      } catch (err) {
        console.error("Background Privacy sync failed:", err);
      }
    };

    const id = window.setInterval(() => {
      void quietSync();
    }, 5 * 60_000);

    return () => window.clearInterval(id);
  }, []);

  const transactions = data?.transactions ?? [];
  const totalCount = data?.total ?? transactions.length;

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/privacy/sync?mode=full");
      return res.json() as Promise<{ fetched: number; upserted: number }>;
    },
    onMutate: () => {
      toast({
        title: "Syncing Privacy.com…",
        description: "Pulling your full approved transaction history.",
      });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/privacy/transactions"] });
      toast({
        title: "Synced from Privacy.com",
        description: `Loaded ${result.fetched} approved transaction${result.fetched === 1 ? "" : "s"}.`,
      });
    },
    onError: (err: unknown) => {
      toast({
        title: "Sync failed",
        description: toErrorMessage(err, "Privacy sync failed"),
        variant: "destructive",
      });
    },
  });

  const settledThisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((tx) => {
        const d = new Date(tx.created);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          tx.status !== "VOIDED"
        );
      })
      .reduce((sum, tx) => sum + parseFloat(tx.amount as string), 0);
  }, [transactions]);

  const grouped = useMemo(() => {
    const groups = new Map<string, PrivacyTransaction[]>();
    for (const tx of transactions) {
      const label = monthLabel(tx.created);
      const list = groups.get(label) ?? [];
      list.push(tx);
      groups.set(label, list);
    }
    return Array.from(groups.entries());
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Privacy Card Transactions
          </h1>
          <p className="text-muted-foreground">
            Approved purchases from your shared Privacy.com cards. Auto-refreshes while this page is open;
            enable the Privacy webhook on Replit for near real-time updates.
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          data-testid="button-sync-privacy"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Syncing..." : "Sync from Privacy"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month (shown)</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-privacy-month-total">
              {formatCurrency(settledThisMonth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Approved spend in the loaded list (excluding voided)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Transactions</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-privacy-count">
              {totalCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {transactions.length < totalCount
                ? `Showing latest ${transactions.length} of ${totalCount} synced charges`
                : "Synced approved charges visible to both of you"}
            </p>
          </CardContent>
        </Card>
      </div>

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <p className="font-medium">Failed to load Privacy transactions</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {toErrorMessage(error)}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Lock className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No Privacy transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click Sync from Privacy to pull approved charges into this shared view.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([label, items]) => (
            <div key={label} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </h2>
              <div className="rounded-lg border divide-y">
                {items.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-4 p-4"
                    data-testid={`privacy-txn-${tx.privacyToken}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium truncate">{tx.merchantDescriptor}</p>
                          <Badge variant={statusVariant(tx.status)} className="text-[10px]">
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatTxnDateTime(tx.created)}
                          {tx.cardMemo ? ` · ${tx.cardMemo}` : ""}
                          {tx.cardLastFour ? ` · ••${tx.cardLastFour}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums shrink-0">{formatCurrency(tx.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
