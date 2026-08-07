import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Lock, User, Fingerprint } from "lucide-react";
import {
  canBiometricLogin,
  getRememberedUsername,
  isNativeApp,
  requestBiometricLogin,
} from "@/lib/native-bridge";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);
  const [native, setNative] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const syncNative = useCallback(() => {
    const inApp = isNativeApp();
    setNative(inApp);
    const bio = canBiometricLogin();
    setBiometricAvailable(bio);
    const remembered = getRememberedUsername();
    if (bio && remembered) {
      setUsername((current) => current || remembered);
    }
  }, []);

  useEffect(() => {
    syncNative();
    window.addEventListener("denny-native-ready", syncNative);
    return () => window.removeEventListener("denny-native-ready", syncNative);
  }, [syncNative]);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    window.__dennyOnBiometricUnlock = async (payload) => {
      setIsBiometricBusy(true);
      try {
        await login(payload.username, payload.password, true);
      } catch {
        toast({
          variant: "destructive",
          title: "Unlock failed",
          description: "Saved sign-in didn’t work. Please enter your password.",
        });
      } finally {
        setIsBiometricBusy(false);
      }
    };

    window.__dennyOnBiometricError = (message) => {
      setIsBiometricBusy(false);
      toast({
        variant: "destructive",
        title: "Couldn’t unlock",
        description: message || "Try again or sign in with your password.",
      });
    };

    return () => {
      delete window.__dennyOnBiometricUnlock;
      delete window.__dennyOnBiometricError;
    };
  }, [login, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsSubmitting(true);
    try {
      await login(username, password, rememberDevice);
    } catch {
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometric = () => {
    setIsBiometricBusy(true);
    requestBiometricLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-sm mx-auto shadow-2xl bg-card/80 backdrop-blur-sm border-border/20">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4 space-x-4">
            <img src="/honey-dipper.png" alt="Honey Dipper" className="w-24 h-24" />
            <img src="/strawberry-cupcake.png" alt="Strawberry Cupcake" className="w-24 h-24" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-amber-500 bg-clip-text text-transparent">
            Denny Love Money
          </CardTitle>
          <CardDescription className="text-base">
            Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {biometricAvailable && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base border-primary/40"
                onClick={handleBiometric}
                disabled={isBiometricBusy || isSubmitting}
              >
                <Fingerprint className="h-5 w-5 mr-2" />
                {isBiometricBusy ? "Waiting for unlock…" : "Unlock with fingerprint or PIN"}
              </Button>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground shrink-0">or use password</span>
                <Separator className="flex-1" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Username"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus={!biometricAvailable}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-3">
              <Checkbox
                id="remember-device"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="remember-device" className="text-sm font-medium leading-none cursor-pointer">
                  Remember this device
                </Label>
                <p className="text-xs text-muted-foreground leading-snug">
                  {native
                    ? "After you sign in, unlock next time with fingerprint, face, or your phone PIN."
                    : "Stay signed in on this browser so you don’t retype your password every visit."}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 transition-all duration-300"
              disabled={isSubmitting || isBiometricBusy}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              <p>Only for HB & SC ❤️</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
