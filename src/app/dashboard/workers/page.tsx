"use client";

import { useEffect, useState } from "react";
import { api, Worker } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  async function loadWorkers() {
    setIsLoading(true);
    const data = await api.workers.list();
    setWorkers(data);
    setIsLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    setIsAdding(true);
    try {
      await api.workers.create(newWorkerName);
      toast.success("Worker berhasil ditambahkan");
      setNewWorkerName("");
      setIsAddOpen(false);
      loadWorkers();
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    await api.workers.delete(id);
    toast.success("Worker dihapus");
    loadWorkers();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Worker Management</h1>
          <p className="text-sm text-slate-500">Kelola worker yang bertugas mengerjakan order.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">
            {workers.length} / 20
          </span>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button disabled={workers.length >= 20}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Worker
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAdd}>
                <DialogHeader>
                  <DialogTitle>Tambah Worker Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan nama worker atau in-game name mereka.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Nama worker..." 
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    autoFocus
                    maxLength={50}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={isAdding}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isAdding || !newWorkerName.trim()}>
                    {isAdding && <Loader2 className="h-4 w-4 animate-spin mr-2"/>}
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {Array.from({length: 3}).map((_, i) => (
             <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
           ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="text-center py-12 border rounded-xl border-dashed bg-slate-50 dark:bg-slate-900/50">
          <p className="text-slate-500">Belum ada worker. Tambahkan worker pertama Anda.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <Card key={worker.id} className="shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{worker.name}</p>
                  <p className="text-xs text-slate-500">Ditambahkan {new Date(worker.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 focus:bg-slate-100">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/30">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    } />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Worker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Yakin ingin menghapus worker <strong>{worker.name}</strong>? Order yang ditugaskan kepadanya akan kehilangan assignment.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(worker.id)} className="bg-red-600 hover:bg-red-700">
                          Hapus Permanen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
