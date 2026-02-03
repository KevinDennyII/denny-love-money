import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Monitor, User, Bell, Shield, Database } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground">Manage your app preferences</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              <CardTitle className="text-lg">Appearance</CardTitle>
            </div>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme('light')}
                data-testid="button-theme-light"
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">Light</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme('dark')}
                data-testid="button-theme-dark"
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme('system')}
                data-testid="button-theme-system"
              >
                <Monitor className="h-5 w-5" />
                <span className="text-xs">System</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Account</CardTitle>
            </div>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="family-name">Family Name</Label>
                <p className="text-sm text-muted-foreground">Denny Family</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="members">Members</Label>
                <p className="text-sm text-muted-foreground">HB & SC</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>Configure alerts and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bill-reminders">Bill Reminders</Label>
                <p className="text-xs text-muted-foreground">Get notified before bills are due</p>
              </div>
              <Switch id="bill-reminders" defaultChecked data-testid="switch-bill-reminders" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="budget-alerts">Budget Alerts</Label>
                <p className="text-xs text-muted-foreground">Alert when nearing budget limits</p>
              </div>
              <Switch id="budget-alerts" defaultChecked data-testid="switch-budget-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-summary">Weekly Summary</Label>
                <p className="text-xs text-muted-foreground">Receive weekly financial summary</p>
              </div>
              <Switch id="weekly-summary" data-testid="switch-weekly-summary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Data</CardTitle>
            </div>
            <CardDescription>Manage your financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Export Data</Label>
                <p className="text-xs text-muted-foreground">Download your data as CSV</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-export">
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Backup</Label>
                <p className="text-xs text-muted-foreground">Last backup: Today</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-backup">
                Backup Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Privacy & Security</CardTitle>
            </div>
            <CardDescription>Protect your financial information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-lock">Auto-Lock</Label>
                <p className="text-xs text-muted-foreground">Lock app after 5 minutes of inactivity</p>
              </div>
              <Switch id="auto-lock" defaultChecked data-testid="switch-auto-lock" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hide-balances">Hide Balances</Label>
                <p className="text-xs text-muted-foreground">Show/hide account balances on dashboard</p>
              </div>
              <Switch id="hide-balances" data-testid="switch-hide-balances" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>Family Budget v1.0.0</p>
        <p>Built with love for the Denny Family</p>
      </div>
    </div>
  );
}
