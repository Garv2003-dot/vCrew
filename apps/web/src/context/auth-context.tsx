'use client';
import { dummyUsers } from "../../../api/src/data/mockLoginData"
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: Number;
  name: string;
  email: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isLoading: boolean;
}
type LoginFailField = "form";
 
export type LoginResult =
  | { ok: true }
  | { ok: false; field: LoginFailField; message: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

const login = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    setIsLoading(true);
 
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
 
      const user = dummyUsers.find(
        (u) => u.email === email && u.password === password
      );
 
      if (!user) {
        setUser(null);
        return { ok: false, field: "form", message: "Please enter correct email or password" };
      }
 
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/profile");
 
      return { ok: true };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
