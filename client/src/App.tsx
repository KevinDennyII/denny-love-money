import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Budget from "@/pages/budget";
import Debts from "@/pages/debts";
import Medical from "@/pages/medical";
import Savings from "@/pages/savings";
import NetWorth from "@/pages/networth";
import Settings from "@/pages/settings";
import DebtPayoff from "@/pages/debt-payoff";
import AuthPage from "@/pages/auth";
import React from "react";

function Layout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to auth page if not authenticated
    // We use setTimeout to avoid state update during render warnings, 
    // though wouter's setLocation is usually safe.
    setTimeout(() => setLocation("/auth"), 0);
    return null;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/accounts">
        <ProtectedRoute component={Accounts} />
      </Route>
      <Route path="/budget">
        <ProtectedRoute component={Budget} />
      </Route>
      <Route path="/debts">
        <ProtectedRoute component={Debts} />
      </Route>
      <Route path="/medical">
        <ProtectedRoute component={Medical} />
      </Route>
      <Route path="/savings">
        <ProtectedRoute component={Savings} />
      </Route>
      <Route path="/networth">
        <ProtectedRoute component={NetWorth} />
      </Route>
      <Route path="/debt-payoff">
        <ProtectedRoute component={DebtPayoff} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="family-budget-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
