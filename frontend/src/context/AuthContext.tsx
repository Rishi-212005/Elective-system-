import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, clearStoredAuth, getStoredToken, getStoredUser, setStoredAuth } from "@/api/http";

export type UserRole = "student" | "admin" | "faculty";

interface AuthUser {
  role: UserRole;
  name: string;
  id: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole, username: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();
    if (storedUser && token) {
      setUser(storedUser);
      // Best-effort: validate token and refresh user info
      apiFetch<{ id: string; role: UserRole; name: string }>("/auth/me", { auth: true })
        .then((me) => {
          setStoredAuth(token, { id: me.id, name: me.name, role: me.role });
          setUser({ id: me.id, name: me.name, role: me.role });
        })
        .catch(() => {
          clearStoredAuth();
          setUser(null);
        });
    }
  }, []);

  const login = async (role: UserRole, username: string, password: string) => {
    try {
      const res = await apiFetch<{ token: string; role: UserRole; name: string; id: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ role, username, password }),
      });

      setStoredAuth(res.token, { id: res.id, name: res.name, role: res.role });
      setUser({ id: res.id, name: res.name, role: res.role });
      return { ok: true as const };
    } catch (e: any) {
      const msg = e?.message || "Login failed";
      return { ok: false as const, message: msg };
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const value = useMemo<AuthContextType>(() => ({ user, login, logout }), [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
