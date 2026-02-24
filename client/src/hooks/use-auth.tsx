import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (passphrase: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user was previously authenticated
    const storedAuth = sessionStorage.getItem("denny-money-auth");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (passphrase: string) => {
    try {
      // We'll verify against the server to keep the passphrase secret-ish
      // (though for now we might just check locally if server route isn't ready, 
      // but plan is to use server)
      await apiRequest("POST", "/api/login", { passphrase });
      
      sessionStorage.setItem("denny-money-auth", "true");
      setIsAuthenticated(true);
      // setLocation("/") is handled by the component reacting to isAuthenticated change
      toast({
        title: "Welcome back!",
        description: "Access granted to the treasury.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "That's not the secret passphrase!",
      });
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem("denny-money-auth");
    setIsAuthenticated(false);
    setLocation("/auth");
    toast({
      title: "Logged out",
      description: "See you later!",
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
