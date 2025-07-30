import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseClient as supabase } from "../db/supabase.client-side";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession(); // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Note: Removed automatic redirect to prevent loops
      // Pages will handle their own authentication checks
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: getAuthErrorMessage(error.message) };
      }

      return {};
    } catch {
      return { error: "Wystąpił nieoczekiwany błąd podczas logowania" };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: getAuthErrorMessage(error.message) };
      }

      return {};
    } catch {
      return { error: "Wystąpił nieoczekiwany błąd podczas rejestracji" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth?mode=reset-password`;
      console.log("Sending password reset with redirect URL:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Reset password error:", error);
        return { error: getAuthErrorMessage(error.message) };
      }

      console.log("Password reset email sent successfully");
      return {};
    } catch (error) {
      console.error("Reset password exception:", error);
      return { error: "Wystąpił nieoczekiwany błąd podczas resetowania hasła" };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { error: getAuthErrorMessage(error.message) };
      }

      return {};
    } catch {
      return { error: "Wystąpił nieoczekiwany błąd podczas zmiany hasła" };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Error message mapping
const getAuthErrorMessage = (error: string): string => {
  switch (error) {
    case "Invalid login credentials":
      return "Nieprawidłowy email lub hasło";
    case "Email not confirmed":
      return "Email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową";
    case "User already registered":
      return "Użytkownik z tym adresem email już istnieje";
    case "Password should be at least 6 characters":
      return "Hasło musi mieć co najmniej 6 znaków";
    case "Unable to validate email address: invalid format":
      return "Nieprawidłowy format adresu email";
    case "Email rate limit exceeded":
      return "Przekroczono limit wysyłania emaili. Spróbuj ponownie później";
    default:
      return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie";
  }
};

export { AuthContext };
