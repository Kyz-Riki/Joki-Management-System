"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function useAuth() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.username) {
        setUser({ username: session.user.user_metadata.username });
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (e.g. token refresh, sign-out from another tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata?.username) {
        setUser({ username: session.user.user_metadata.username });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password?: string) => {
    const supabase = getSupabaseClient();

    if (!password) {
      // Called after a register flow — session is already set server-side,
      // just sync local state without re-fetching credentials.
      setUser({ username });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Login gagal");
      }

      // Hydrate the browser Supabase client with the tokens returned by the API
      await supabase.auth.setSession({
        access_token: data.data.session.access_token,
        refresh_token: data.data.session.refresh_token,
      });

      setUser({ username: data.data.user.username });
      toast("Login berhasil", {
        description: `Selamat datang kembali, ${username}!`,
      });
      router.push("/dashboard");
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    // Invalidate the server-side cookie/session first
    await fetch("/api/auth/logout", { method: "POST" });
    // Then clear the browser client session
    await supabase.auth.signOut();
    setUser(null);
    toast("Logout berhasil", { description: "Sampai jumpa!" });
    router.push("/login");
  };

  return { user, isLoading, isAuthenticated: !!user, login, logout, setUser };
}
