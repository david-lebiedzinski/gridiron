import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/client";
import { signIn, signUp, signOut } from "../lib/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface FetchUserResponse {
  data: {
    user: User | null;
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const onFetchUser = ({ data }: FetchUserResponse) => {
      if (!cancelled) {
        setUser(data.user);
        setLoading(false);
      }
    };

    const onFetchUserError = () => {
      if (!cancelled) {
        setLoading(false);
      }
    };

    supabase.auth.getUser().then(onFetchUser).catch(onFetchUserError);

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await signIn(email, password);
    setUser(data.user);
  }

  async function register(email: string, password: string) {
    const data = await signUp(email, password);
    setUser(data.user);
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        register,
        loading,
        logout,
        login,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
