"use client";

import { useState, useEffect } from "react";
import type { AuthUser } from "@/components/gym/types";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return { user, loading, login, logout };
}
