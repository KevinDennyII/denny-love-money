import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function AuthPage() {
  const [passphrase, setPassphrase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;

    setIsSubmitting(true);
    try {
      await login(passphrase);
    } catch (error) {
      // Error handled in useAuth
      setPassphrase("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-amber-50 dark:from-pink-950/20 dark:to-amber-950/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-pink-100 dark:border-pink-900">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center gap-8 mb-6 text-5xl animate-bounce pt-4 items-end">
            <div className="relative flex items-center justify-center">
              <span role="img" aria-label="Cupcake" className="text-6xl">🧁</span>
              <span role="img" aria-label="Strawberry" className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl drop-shadow-sm">🍓</span>
            </div>
            
            <div className="flex flex-col items-center -mb-2 scale-90">
              <div className="relative">
                {/* Honey Dipper SVG */}
                <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-md rotate-45 transform origin-center">
                  <path d="M30 30 L70 70" stroke="#8B4513" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="30" cy="30" r="15" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
                  <path d="M20 25 L40 25 M20 30 L40 30 M20 35 L40 35" stroke="#DAA520" strokeWidth="2" />
                  <path d="M30 45 Q30 60 35 70" stroke="#FFD700" strokeWidth="4" fill="none" opacity="0.8" />
                </svg>
              </div>
              <div className="flex flex-col items-center leading-none mt-[-10px]">
                <span className="font-serif font-bold text-xl text-yellow-400 tracking-wide drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" style={{ textShadow: "1px 1px 0 #8B4513, -1px -1px 0 #8B4513, 1px -1px 0 #8B4513, -1px 1px 0 #8B4513" }}>
                  HONEY
                </span>
                <span className="font-serif font-bold text-lg text-yellow-400 tracking-wide drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]" style={{ textShadow: "1px 1px 0 #8B4513, -1px -1px 0 #8B4513, 1px -1px 0 #8B4513, -1px 1px 0 #8B4513" }}>
                  BUNCHES
                </span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-amber-500 bg-clip-text text-transparent">
            Denny Love Money
          </CardTitle>
          <CardDescription className="text-base">
            Enter the secret passphrase to access the vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Secret Passphrase"
                  className="pl-9"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Unlocking..." : "Unlock Vault"}
            </Button>
            <div className="text-center text-xs text-muted-foreground mt-4">
              <p>Only for HB & SC ❤️</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
