import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { notifyNativeLogin, notifyNativeLogout } from "@/lib/native-bridge";

const USER_KEY = "denny-money-user";
const REMEMBER_KEY = "denny-money-remember-device";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string, rememberDevice?: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  readOnly: boolean;
  rememberDevice: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const storedRemember = localStorage.getItem(REMEMBER_KEY) === "1";
    setRememberDevice(storedRemember);

    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, remember = true) => {
    try {
      const response = await apiRequest("POST", "/api/login", { username, password });
      const { user: loggedInUser } = await response.json();

      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "1");
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      setRememberDevice(remember);
      setUser(loggedInUser);
      setIsAuthenticated(true);

      notifyNativeLogin(username, password, remember);

      toast({
        title: `Welcome back, ${loggedInUser.username}! `,
        description: remember
          ? "This device is remembered — next time you can use fingerprint or PIN."
          : "Access granted to the treasury.",
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
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(USER_KEY);
    setRememberDevice(false);
    setIsAuthenticated(false);
    setUser(null);
    notifyNativeLogout();
    setLocation("/auth");
    toast({
      title: "Logged out",
      description: "See you later!",
    });
  };

  const readOnly = user?.role !== "admin";

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, isLoading, readOnly, rememberDevice }}
    >
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
