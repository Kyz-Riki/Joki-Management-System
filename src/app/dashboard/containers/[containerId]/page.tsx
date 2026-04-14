"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Order, Worker, Container } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, PlayCircle, CheckCircle2, History, Trash2, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function OrderManagementPage() {
  const params = useParams();
  const router = useRouter();
  const containerId = params.containerId as string;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [container, setContainer] = useState<Container | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add order modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newOrder, setNewOrder] = useState({ name: "", details: "", workerId: "" });

  // Success dialog after order creation
  const [createdOrder, setCreatedOrder] = useState<{ uid: string; queue_number: number } | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Simulate real-time by polling every 5 seconds since we mock Supabase
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [containerId]);

  async function loadData() {
    try {
      const cls = await api.containers.list();
      const curr = cls.find(c => c.id === containerId);
      if (!curr) {
        toast.error("Container tidak ditemukan");
        router.push("/dashboard/containers");
        return;
      }
      setContainer(curr);
      setWorkers(await api.workers.list());
      setOrders(await api.orders.list(containerId));
    } catch (err) {
      console.error("Gagal memuat data", err);
      // Jangan tampilkan toast berulang kali saat polling jika gagal network
    } finally {
       setIsLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setIsAdding(true);
    try {
      const order = await api.orders.create(containerId, newOrder.name, newOrder.details, newOrder.workerId);
      setIsAddOpen(false);
      setNewOrder({ name: "", details: "", workerId: "" });
      // Tampilkan dialog sukses dengan UID
      if (order.uid) {
        setCreatedOrder({ uid: order.uid, queue_number: order.queue_number });
        setIsSuccessOpen(true);
      } else {
        toast.success("Order berhasil dimasukkan dalam antrean");
      }
      loadData();
    } finally {
      setIsAdding(false);
    }
  }

  function handleCopyUid() {
    if (!createdOrder) return;
    navigator.clipboard.writeText(createdOrder.uid).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }

  function handleCopyOrderUid(orderId: string, uid: string) {
    navigator.clipboard.writeText(uid).then(() => {
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  async function updateStatus(id: string, status: Order["status"], name: string) {
    await api.orders.updateStatus(containerId, id, status);
    if (status === "PROGRESS") toast("Order mulai diproses!", { description: `Order ${name} sedang dikerjakan.` });
    if (status === "DONE") toast.success("Order Selesai!", { description: `Order ${name} berhasil diselesaikan.` });
    loadData();
  }

  async function handleDelete(id: string) {
    await api.orders.delete(containerId, id);
    toast.info("Order dihapus secara permanen.");
    loadData();
  }

  const activeOrders = orders.filter(o => o.status === "QUEUE" || o.status === "PROGRESS");
  const inProgress = orders.filter(o => o.status === "PROGRESS").sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const inQueue = orders.filter(o => o.status === "QUEUE").sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (!container) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/containers" className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Containers
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-slate-900 dark:bg-white text-transparent bg-clip-text">Kelola Order: {container?.game_name}</h1>
            <p className="text-sm text-slate-500">Maks {activeOrders.length} / 50 Order Aktif</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/containers/${containerId}/history`}>
              <Button variant="outline"><History className="mr-2 h-4 w-4" /> Riwayat</Button>
            </Link>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger render={
                <Button disabled={activeOrders.length >= 50}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Order
                </Button>
              } />
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleAdd}>
                  <DialogHeader>
                    <DialogTitle>Tambah Order Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Nama Customer (IGN)</label>
                       <Input value={newOrder.name} onChange={e => setNewOrder({...newOrder, name: e.target.value})} placeholder="e.g. KaguraBestGirl" required />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Pilih Worker</label>
                       <select 
                         className="w-full flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:border-slate-800 dark:bg-slate-950"
                         value={newOrder.workerId}
                         onChange={(e) => setNewOrder({...newOrder, workerId: e.target.value})}
                         required
                       >
                         <option value="" disabled>-- Pilih Worker --</option>
                         {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Detail Pesanan (opsional)</label>
                       <Textarea value={newOrder.details} onChange={e => setNewOrder({...newOrder, details: e.target.value})} placeholder="e.g. Mythic Glory bintang 50" rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} disabled={isAdding}>Batal</Button>
                    <Button type="submit" disabled={isAdding || !newOrder.name || !newOrder.workerId}>Simpan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* SUCCESS DIALOG */}
      <Dialog open={isSuccessOpen} onOpenChange={(open) => { setIsSuccessOpen(open); if (!open) setIsCopied(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              Order Berhasil Ditambahkan!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center">
              <p className="text-sm text-slate-500">Nomor Antrian</p>
              <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">#{createdOrder?.queue_number}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Kode Lacak Customer:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-center">
                  <span className="text-2xl font-mono font-bold tracking-[0.3em] text-slate-800 dark:text-slate-100">
                    {createdOrder?.uid}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUid}
                  className={isCopied ? "text-green-600 border-green-300" : ""}
                  title="Salin kode"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {isCopied && (
                <p className="text-xs text-green-600 text-center animate-in fade-in">✓ Kode disalin!</p>
              )}
            </div>
            <p className="text-xs text-slate-500 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              Berikan kode ini kepada customer agar mereka bisa melacak posisi antrean di halaman publik.
            </p>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setIsSuccessOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PROGRESS SECTION */}
      <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2 text-amber-700 dark:text-amber-500 mb-4">
           🔄 Sedang Dikerjakan ({inProgress.length})
        </h2>
        
        {inProgress.length === 0 ? (
          <div className="text-center py-6 text-sm text-amber-600/60 dark:text-amber-500/50 font-medium">Kosong. Tekan "Proses" pada antrean menunggu.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {inProgress.map(order => (
               <Card key={order.id} className="border-amber-200 dark:border-amber-800 animate-in fade-in slide-in-from-bottom-2">
                 <CardContent className="p-4 flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                     <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-1 rounded-md text-xs">
                       #{order.queue_number}
                     </span>
                     <div className="flex items-center gap-1.5">
                        {order.uid ? (
                          <button
                            onClick={() => handleCopyOrderUid(order.id, order.uid!)}
                            title="Salin kode lacak customer"
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
                              copiedId === order.id
                                ? "bg-green-50 border-green-300 text-green-600 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                            }`}
                          >
                            {copiedId === order.id ? (
                              <><Check className="h-3 w-3" />Tersalin!</>
                            ) : (
                              <><Copy className="h-3 w-3" />{order.uid}</>
                            )}
                          </button>
                        ) : (
                          <span
                            title="Order lama, resave untuk memunculkan UID"
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-slate-50 border-slate-200 text-slate-400 italic dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed"
                          >
                            <span className="w-10 text-center">-</span>
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                   </div>
                   <div>
                     <p className="font-bold text-base truncate">{order.customer_name}</p>
                     <p className="text-xs text-slate-500 truncate">{order.details || "Tidak ada detail"}</p>
                     <p className="text-xs font-medium text-primary mt-2">Dikerjakan oleh: {order.worker_name}</p>
                   </div>
                   <Button onClick={() => updateStatus(order.id, "DONE", order.customer_name)} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white border-transparent">
                     <CheckCircle2 className="mr-2 h-4 w-4" /> Selesai
                   </Button>
                 </CardContent>
               </Card>
            ))}
          </div>
        )}
      </div>

      {/* QUEUE SECTION */}
      <div className="rounded-xl border shadow-sm p-4 sm:p-6 bg-white dark:bg-slate-900">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-200">
           ⏳ Menunggu ({inQueue.length})
        </h2>
        
        {inQueue.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">Antrean kosong.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {inQueue.map(order => (
               <Card key={order.id} className="shadow-sm">
                 <CardContent className="p-4 flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                     <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1 rounded-md text-xs">
                       #{order.queue_number}
                     </span>
                     <div className="flex items-center gap-1.5">
                        {order.uid ? (
                          <button
                            onClick={() => handleCopyOrderUid(order.id, order.uid!)}
                            title="Salin kode lacak customer"
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
                              copiedId === order.id
                                ? "bg-green-50 border-green-300 text-green-600 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                            }`}
                          >
                            {copiedId === order.id ? (
                              <><Check className="h-3 w-3" />Tersalin!</>
                            ) : (
                              <><Copy className="h-3 w-3" />{order.uid}</>
                            )}
                          </button>
                        ) : (
                          <span
                            title="Order lama, resave untuk memunculkan UID"
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-slate-50 border-slate-200 text-slate-400 italic dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed"
                          >
                            <span className="w-10 text-center">-</span>
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                   </div>
                   <div>
                     <p className="font-bold text-base truncate">{order.customer_name}</p>
                     <p className="text-xs text-slate-500 truncate">{order.details || "Tidak ada detail"}</p>
                     <p className="text-xs font-medium mt-2">Tugas: {order.worker_name}</p>
                   </div>
                   <div className="flex gap-2 mt-2">
                     <Button onClick={() => updateStatus(order.id, "PROGRESS", order.customer_name)} className="flex-1">
                       <PlayCircle className="mr-2 h-4 w-4" /> Proses
                     </Button>
                     <AlertDialog>
                       <AlertDialogTrigger render={
                         <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       } />
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Hapus Antrean?</AlertDialogTitle>
                           <AlertDialogDescription>Yakin ingin membatalkan/menghapus order ini secara permanen?</AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Batal</AlertDialogCancel>
                           <AlertDialogAction onClick={() => handleDelete(order.id)} className="bg-red-600 focus:ring-red-600">Hapus Permanen</AlertDialogAction>
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

    </div>
  );
}
