"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAuth() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("joki_auth_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const mockUser = { username };
    localStorage.setItem("joki_auth_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setIsLoading(false);
    toast("Login berhasil", { description: `Selamat datang kembali, ${username}!` });
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("joki_auth_user");
    setUser(null);
    toast("Logout berhasil", { description: "Sampai jumpa!" });
    router.push("/login"); // Fixed: Should route to /login as per Phase 1.4 "Mulai Gratis -> /register" or landing
  };

  return { user, isLoading, isAuthenticated: !!user, login, logout, setUser };
}
