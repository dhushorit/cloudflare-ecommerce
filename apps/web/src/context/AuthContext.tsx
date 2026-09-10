import React, { createContext, useContext, useState, useEffect } from "react";
import type { AdminUser } from "../types";
import { api } from "../lib/api";

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem("admin_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { token, user } = await api.adminLogin(email, pass);
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_user", JSON.stringify(user));
      setAdmin(user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
