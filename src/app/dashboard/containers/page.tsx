"use client";

import { useEffect, useState } from "react";
import { api, Container } from "@/lib/api";
import { GAME_LIST } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function ContainersPage() {
  const { user } = useAuth();
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedGameCode, setSelectedGameCode] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  // Two step delete confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    loadContainers();
  }, []);

  async function loadContainers() {
    setIsLoading(true);
    const data = await api.containers.list();
    setContainers(data);
    setIsLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGameCode || !user?.username) return;
    setIsAdding(true);
    try {
      await api.containers.create(selectedGameCode, user.username);
      toast.success("Container antrean berhasil dibuat");
      setSelectedGameCode("");
      setIsAddOpen(false);
      loadContainers();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat container");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggle(id: string, currentStatus: boolean, gameName: string) {
    await api.containers.toggleActive(id);
    toast.success(`Antrean ${gameName} ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    loadContainers();
  }

  async function handleDelete(id: string) {
    await api.containers.delete(id);
    toast.success("Container dihapus permanen");
    setDeleteConfirmText("");
    loadContainers();
  }

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    // Note: since this may run locally or without HTTPS context, clipboard might fail, 
    // but in real use case it's fine.
    navigator.clipboard.writeText(window.location.origin + text);
    setCopiedId(id);
    toast.success("Link berhasil disalin");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const usedGameCodes = containers.map(c => c.game_code);
  const availableGames = GAME_LIST.filter(g => !usedGameCodes.includes(g.code));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Container Management</h1>
          <p className="text-sm text-slate-500">Kelola ruang antrean untuk berbagai layanan game Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">
            {containers.length} / 5
          </span>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button disabled={containers.length >= 5 || availableGames.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> Buat Container
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>Buat Container Antrean</DialogTitle>
                  <DialogDescription>
                    Pilih layanan game. Satu game hanya bisa memiliki satu antrean.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pilih Game</label>
                    <select 
                      className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus:ring-slate-300"
                      value={selectedGameCode}
                      onChange={(e) => setSelectedGameCode(e.target.value)}
                      required
                    >
                      <option value="" disabled>-- Pilih Game --</option>
                      {GAME_LIST.map((game) => (
                        <option 
                          key={game.code} 
                          value={game.code}
                          disabled={usedGameCodes.includes(game.code)}
                        >
                          {game.name} {usedGameCodes.includes(game.code) && "(Sudah Dibuat)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedGameCode && user && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md border text-sm text-slate-500 break-all">
                      Preview Link:<br/>
                      <strong className="text-slate-900 dark:text-slate-200">/q/{user.username}/{selectedGameCode}</strong>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isAdding}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isAdding || !selectedGameCode}>
                    {isAdding && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}
                    Buat Sekarang
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
           {Array.from({length: 2}).map((_, i) => (
             <Skeleton key={i} className="h:[160px] w-full rounded-xl" />
           ))}
        </div>
      ) : containers.length === 0 ? (
        <div className="text-center py-12 border rounded-xl border-dashed bg-slate-50 dark:bg-slate-900/50">
          <p className="text-slate-500">Belum ada container. Buat container untuk mulai menerima antrean.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {containers.map((container) => (
            <Card key={container.id} className={`shadow-sm transition-opacity duration-300 ${!container.is_active ? 'opacity-60 saturate-50' : 'opacity-100'}`}>
              <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                      {container.game_name}
                      <Badge variant="secondary" className="font-mono text-[10px] uppercase">{container.game_code}</Badge>
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md px-2 max-w-fit mt-2">
                       <span className="truncate max-w-[200px] sm:max-w-xs cursor-default">
                         {container.slug}
                       </span>
                       <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 shrink-0" onClick={() => handleCopy(container.slug, container.id)}>
                         {copiedId === container.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                       </Button>
                       <Link href={container.slug} target="_blank" className="shrink-0">
                         <Button variant="ghost" size="icon" className="h-6 w-6">
                           <ExternalLink className="h-3 w-3" />
                         </Button>
                       </Link>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch 
                      checked={container.is_active} 
                      onCheckedChange={() => handleToggle(container.id, container.is_active, container.game_name)} 
                      aria-label="Toggle active status"
                    />
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      {container.is_active ? "Aktif" : "Tutup"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t mt-auto">
                  <span className="text-sm font-medium text-primary">
                    {container.active_orders_count} Antrean Aktif
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/containers/${container.id}`}>
                      <Button variant="secondary" size="sm">
                        Kelola Order
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger render={
                         <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:hover:bg-red-950/40">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      } />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-600">Hapus Container Permanen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini akan menghapus antrean <strong>{container.game_name}</strong> beserta seluruh riwayat order di dalamnya.
                            <br/><br/>
                            Untuk konfirmasi, ketik nama game: <br/><strong>{container.game_name}</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="my-2">
                           <Input 
                             value={deleteConfirmText}
                             onChange={(e) => setDeleteConfirmText(e.target.value)}
                             placeholder={container.game_name}
                           />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              if (deleteConfirmText !== container.game_name) {
                                e.preventDefault();
                                return;
                              }
                              handleDelete(container.id);
                            }} 
                            disabled={deleteConfirmText !== container.game_name}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
