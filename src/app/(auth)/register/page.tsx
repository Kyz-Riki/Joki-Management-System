"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Honeypot check (client-side, server also checks)
    if (honeypot) return;

    if (username.length < 3) {
      setError("Username minimal 3 karakter.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (!turnstileToken) {
      setError("Selesaikan verifikasi Turnstile terlebih dahulu.");
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          turnstileToken,
          honeypot,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Pendaftaran gagal.");
        return;
      }

      // Auto-login after successful registration
      await login(username, password);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 py-12">
      <Link
        href="/"
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Beranda
      </Link>

      <Card className="w-full max-w-md shadow-xl border-slate-200/60 dark:border-slate-800">
        <CardHeader className="space-y-2 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <span className="font-bold text-3xl tracking-tight text-primary">
              JokiSystem.
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
          <CardDescription>
            Mulai kelola antrean joki Anda dengan lebih efisien sekarang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* HONEYPOT FIELD */}
            <div style={{ display: "none" }} aria-hidden="true">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="izumi-store"
                pattern="[a-z0-9-]+"
                title="Hanya huruf kecil, angka, dan dash (-)"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                disabled={isRegistering}
                required
              />
              <p className="text-xs text-slate-500">
                Hanya huruf kecil, angka, dan dash (-). Contoh: izumi-store
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@izumistore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isRegistering}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isRegistering}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">Minimal 8 karakter.</p>
            </div>

            {/* Cloudflare Turnstile — set NEXT_PUBLIC_TURNSTILE_SITE_KEY in .env.local */}
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
              className="w-full flex justify-center py-2"
            />

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
          <p className="text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
