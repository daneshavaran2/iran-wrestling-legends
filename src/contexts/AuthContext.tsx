// Open kiosk mode: authentication has been removed.
// This file remains as a no-op stub so existing imports keep compiling.
import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: null;
  session: null;
  isAdmin: true;
  isLoading: false;
  signIn: (email: string, password: string) => Promise<{ error: null }>;
  signUp: (email: string, password: string) => Promise<{ error: null }>;
  signOut: () => Promise<void>;
  makeAdmin: () => Promise<{ error: null }>;
  hasAnyAdmin: true;
  checkAdminStatus: () => Promise<void>;
}

const value: AuthContextType = {
  user: null,
  session: null,
  isAdmin: true,
  isLoading: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  makeAdmin: async () => ({ error: null }),
  hasAnyAdmin: true,
  checkAdminStatus: async () => {},
};

const AuthContext = createContext<AuthContextType>(value);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
