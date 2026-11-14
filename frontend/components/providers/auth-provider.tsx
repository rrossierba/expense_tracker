"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api-client";
import { authStorage } from "../../lib/auth-storage";
import { LoginCredentials, RegisterPayload, TokenResponse, User } from "../../types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchUserProfile = async (): Promise<User | null> => {
    try {
      const userData = await api.get<User>("/auth/me");
      setUser(userData);
      return userData;
    } catch {
      authStorage.clearTokens();
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (authStorage.isAuthenticated()) {
        await fetchUserProfile();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      authStorage.clearTokens();
      setUser(null);
      router.push("/login");
    };

    window.addEventListener("auth:expired", handleExpiredSession);
    return () => window.removeEventListener("auth:expired", handleExpiredSession);
  }, [router]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const tokens = await api.post<TokenResponse>("/auth/login", credentials, {
        skipAuth: true,
      });
      authStorage.setTokens(tokens.access_token, tokens.refresh_token);
      await fetchUserProfile();
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await api.post<User>("/auth/register", payload, {
        skipAuth: true,
      });
      // Automatically login after successful registration
      await login({
        email: payload.email,
        password: payload.password,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authStorage.clearTokens();
    setUser(null);
    router.push("/login");
  };

  const refreshUserProfile = async () => {
    if (authStorage.isAuthenticated()) {
      await fetchUserProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

