import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface LoginResponse {
  success: boolean;
  user: User;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  readOnly: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("denny-money-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/login", { username, password });
      const { user: loggedInUser } = await response.json();
      
      
      sessionStorage.setItem("denny-money-user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsAuthenticated(true);

      toast({
        title: `Welcome back, ${loggedInUser.username}! `,
        description: "Access granted to the treasury.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid username or password.",
      });
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem("denny-money-user");
    setIsAuthenticated(false);
    setUser(null);
    setLocation("/auth");
    toast({
      title: "Logged out",
      description: "See you later!",
    });
  };

  const readOnly = user?.role !== 'admin';

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, readOnly }}>
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
