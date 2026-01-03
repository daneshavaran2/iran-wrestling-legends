import React, { createContext, useContext, useState, ReactNode } from 'react';

// Mock auth context - will be replaced with Supabase Auth
interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  makeAdmin: () => Promise<{ error: Error | null }>;
  hasAnyAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(false);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock sign in - will be replaced with Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      if (email && password.length >= 6) {
        const mockUser = { id: crypto.randomUUID(), email };
        setUser(mockUser);
        // Check if this user is admin (mock)
        if (email === 'admin@museum.ir') {
          setIsAdmin(true);
          setHasAnyAdmin(true);
        }
        return { error: null };
      }
      return { error: new Error('ایمیل یا رمز عبور نادرست است') };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (email && password.length >= 6) {
        const mockUser = { id: crypto.randomUUID(), email };
        setUser(mockUser);
        return { error: null };
      }
      return { error: new Error('اطلاعات نامعتبر است') };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
  };

  const makeAdmin = async () => {
    if (user && !hasAnyAdmin) {
      setIsAdmin(true);
      setHasAnyAdmin(true);
      return { error: null };
    }
    return { error: new Error('امکان ایجاد ادمین وجود ندارد') };
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isLoading,
      signIn,
      signUp,
      signOut,
      makeAdmin,
      hasAnyAdmin,
    }}>
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
