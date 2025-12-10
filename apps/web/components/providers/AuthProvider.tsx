"use client";

import { createContext, useContext, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  user: User | null;
  children: ReactNode;
}

export function AuthProvider({ user, children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}
