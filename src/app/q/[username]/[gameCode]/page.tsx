"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, Container, Order } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, SearchX } from "lucide-react";
import { StatusBadge } from "@/components/queue/StatusBadge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function censorName(name: string): string {
  if (name.length <= 4) return name[0] + '***';
  return name.slice(0, 2) + '***' + name.slice(-2);
}

export default function PublicQueuePage() {
  const params = useParams();
  const username = params.username as string;
  const gameCode = params.gameCode as string;
  
  const [container, setContainer] = useState<Container | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // simulate real-time
    return () => clearInterval(interval);
  }, [username, gameCode]);

  async function loadData() {
    try {
      const cls = await api.containers.list();
      const c = cls.find(x => x.slug === `/q/${username}/${gameCode}`);
      if (!c) {
         setIsNotFound(true);
         return;
      }
      setContainer(c);
      
      if (c.is_active) {
         const ord = await api.orders.list(c.id);
         setOrders(ord.sort((a, b) => {
            // PROGRESS on top, then QUEUE, then DONE (although DONE might not be shown much)
            const w = { "PROGRESS": 1, "QUEUE": 2, "DONE": 3 };
            const aw = w[a.status as "PROGRESS" | "QUEUE" | "DONE"] || 4;
            const bw = w[b.status as "PROGRESS" | "QUEUE" | "DONE"] || 4;
            if (aw !== bw) return aw - bw;
            // if same, sort by created date (oldest first)
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
         }));
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return <div className="p-8 space-y-4 max-w-3xl mx-auto"><Skeleton className="h-12 w-full"/><Skeleton className="h-40 w-full"/></div>;
  if (isNotFound) return (
     <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
       <div className="text-center space-y-4 max-w-md">
         <div className="h-20 w-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
           <SearchX className="h-10 w-10 text-slate-500" />
         </div>
         <h1 className="text-2xl font-bold">Toko Tidak Ditemukan</h1>
         <p className="text-slate-500">Pastikan link antrean yang kamu buka sudah benar. URL tidak tersedia atau sudah dihapus.</p>
         <div className="pt-4">
           <Link href="/"><Button variant="outline">Kembali ke Beranda</Button></Link>
         </div>
       </div>
     </div>
  );
  if (container && !container.is_active) return (
     <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
       <div className="text-center space-y-4 max-w-md">
         <div className="h-20 w-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
           <Lock className="h-10 w-10 text-amber-600 dark:text-amber-500" />
         </div>
         <h1 className="text-2xl font-bold">Antrean Sedang Tutup</h1>
         <p className="text-slate-500">Silakan hubungi pemilik joki ({username}) untuk informasi lebih lanjut mengenai kapan antrean akan dibuka kembali.</p>
       </div>
     </div>
  );

  const qOrders = orders.filter(o => o.status === "QUEUE");
  const pOrders = orders.filter(o => o.status === "PROGRESS");
  const dOrdersToday = orders.filter(o => o.status === "DONE" && new Date(o.updated_at).toDateString() === new Date().toDateString());

  const displayOrders = orders.filter(o => o.status === "QUEUE" || o.status === "PROGRESS" || (o.status === "DONE" && new Date(o.updated_at).toDateString() === new Date().toDateString()));

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
       <header className="bg-white dark:bg-slate-900 border-b py-6 px-4 mb-6 sticky top-0 z-10 shadow-sm">
         <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">{username}</p>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                 Antrean {container?.game_name}
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-500 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200 dark:border-green-900/50 w-fit">
               <span className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
               </span>
               Live Updates
            </div>
         </div>
       </header>

       <main className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
               <CardHeader className="p-4 pb-2">
                 <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Menunggu</CardTitle>
               </CardHeader>
               <CardContent className="p-4 pt-0">
                 <div className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200">{qOrders.length}</div>
               </CardContent>
            </Card>
            <Card className="shadow-sm border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10">
               <CardHeader className="p-4 pb-2">
                 <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider">Proses</CardTitle>
               </CardHeader>
               <CardContent className="p-4 pt-0">
                 <div className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">{pOrders.length}</div>
               </CardContent>
            </Card>
            <Card className="shadow-sm border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
               <CardHeader className="p-4 pb-2">
                 <CardTitle className="text-xs font-medium text-green-600 dark:text-green-500 uppercase tracking-wider">Selesai (Hari Ini)</CardTitle>
               </CardHeader>
               <CardContent className="p-4 pt-0">
                 <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{dOrdersToday.length}</div>
               </CardContent>
            </Card>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
             <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
               <h2 className="font-semibold text-lg">Daftar Antrean Publik</h2>
               <p className="text-xs text-slate-500">Nama disamarkan untuk menjaga privasi. Dikerjakan berdasarkan urutan.</p>
             </div>
             
             {displayOrders.length === 0 ? (
               <div className="text-center py-12 text-slate-500">Belum ada antrean masuk.</div>
             ) : (
               <div className="relative w-full overflow-auto">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead className="w-[80px]">No.</TableHead>
                       <TableHead>Nama (IGN)</TableHead>
                       <TableHead className="hidden md:table-cell">Waktu Masuk</TableHead>
                       <TableHead className="text-right">Status</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {displayOrders.map((order) => (
                       <TableRow key={order.id} className={`${order.status === "PROGRESS" ? "bg-amber-50/30 dark:bg-amber-950/20" : ""}`}>
                         <TableCell className="font-bold text-slate-700 dark:text-slate-300">
                           #{order.queue_number}
                         </TableCell>
                         <TableCell className="font-medium text-base">
                           {censorName(order.customer_name)}
                         </TableCell>
                         <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                           {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </TableCell>
                         <TableCell className="text-right">
                           <StatusBadge status={order.status} />
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             )}
          </div>
       </main>
       
       <div className="mt-12 text-center text-xs text-slate-400 pb-8">
         <p>Powered by <Link href="/" className="font-bold text-slate-500 hover:text-primary">JokiSystem.</Link></p>
       </div>
    </div>
  );
}
