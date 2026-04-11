"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  
  // State for profile form
  const [email, setEmail] = useState(user?.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // State for password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Initialize values when user data loads if needed
  if (!email && user?.email) {
    setEmail(user.email);
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    try {
      // Simulate API call for frontend mockup duration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // We assume backend integration handles the actual update
      // As mock, we show a success toast.
      toast.success("Profil berhasil diperbarui", { description: "Alamat email Anda telah tersimpan." });
    } catch (err: any) {
      toast.error("Gagal memperbarui profil: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Password Gagal", { description: "Password baru dan konfirmasi tidak cocok." });
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password Terlalu Pendek", { description: "Silakan gunakan minimal 6 karakter." });
      return;
    }

    setIsSavingPassword(true);
    
    try {
      // Simulate API change
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success("Password Berhasil Diubah", { description: "Gunakan password baru Anda untuk login berikutnya." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("Gagal mengubah password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Profil</h1>
        <p className="text-sm text-slate-500">Kelola dan amankan akun joki Anda disini.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="profile">Profil Akun</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
        </TabsList>
        
        {/* PROFILE TAB */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Informasi dasar mengenai akun manajemen Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={user?.username || ""} 
                    disabled 
                    className="bg-slate-50 text-slate-500 dark:bg-slate-900"
                  />
                  <p className="text-[10px] text-slate-500">Username tidak dapat diubah (digunakan untuk link queue).</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="nama@contoh.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* SECURITY TAB */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="shadow-sm border-red-100 dark:border-red-900/30">
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>
                Pastikan Anda mengingat password lama untuk melakukan perubahan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Password Saat Ini</Label>
                  <Input 
                    id="current-pw" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="pt-2">
                  <hr className="border-t border-slate-100 dark:border-slate-800" />
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="new-pw">Password Baru</Label>
                  <Input 
                    id="new-pw" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Konfirmasi Password Baru</Label>
                  <Input 
                    id="confirm-pw" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}>
                  {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Perbarui Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
