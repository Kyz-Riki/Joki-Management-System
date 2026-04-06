"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Order } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function OrderHistoryPage() {
  const params = useParams();
  const containerId = params.containerId as string;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [containerId]);

  async function loadData() {
    setIsLoading(true);
    setOrders(await api.orders.list(containerId));
    setIsLoading(false);
  }

  async function updateStatus(id: string, status: Order["status"], actionMessage: string) {
    await api.orders.updateStatus(containerId, id, status);
    toast.success(actionMessage);
    loadData();
  }

  async function handleDelete(id: string) {
    await api.orders.delete(containerId, id);
    toast.info("Order dihapus dari riwayat.");
    loadData();
  }

  const doneOrders = orders.filter(o => o.status === "DONE").sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const archivedOrders = orders.filter(o => o.status === "ARCHIVED").sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <Link href={`/dashboard/containers/${containerId}`} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Antrean Aktif
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Order</h1>
          <p className="text-sm text-slate-500">Lihat semua antrean yang sudah selesai atau diarsipkan.</p>
        </div>
      </div>

      <Tabs defaultValue="done" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 bg-slate-100 dark:bg-slate-900">
          <TabsTrigger value="done" className="font-medium">
             Selesai ({doneOrders.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="font-medium">
             Diarsipkan ({archivedOrders.length})
          </TabsTrigger>
        </TabsList>
        <div className="mt-6 border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-950">
          <TabsContent value="done" className="m-0 border-none outline-none">
             {doneOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Tidak ada riwayat order selesai.</div>
             ) : (
                <div className="divide-y">
                   {doneOrders.map(o => (
                      <HistoryItem 
                        key={o.id} 
                        order={o} 
                        onAction={() => updateStatus(o.id, "ARCHIVED", "Order diarsipkan.")} 
                        actionLabel="Arsipkan" 
                        actionIcon={<Archive className="h-4 w-4 mr-2" />} 
                      />
                   ))}
                </div>
             )}
          </TabsContent>
          <TabsContent value="archived" className="m-0 border-none outline-none">
             {archivedOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Tidak ada order yang diarsipkan.</div>
             ) : (
                <div className="divide-y">
                   {archivedOrders.map(o => (
                      <HistoryItem 
                        key={o.id} 
                        order={o} 
                        onAction={() => updateStatus(o.id, "QUEUE", "Order diaktifkan kembali dan masuk di antrean.")} 
                        actionLabel="Kembalikan" 
                        actionIcon={<RefreshCw className="h-4 w-4 mr-2" />} 
                        isArchived
                        onDelete={() => handleDelete(o.id)}
                      />
                   ))}
                </div>
             )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function HistoryItem({ order, onAction, actionLabel, actionIcon, isArchived, onDelete }: any) {
  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
      <div className="flex gap-4">
         <div className="h-10 w-10 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-500">
           #{order.queue_number}
         </div>
         <div className="space-y-1">
           <p className="font-semibold text-sm sm:text-base">{order.customer_name}</p>
           <div className="flex items-center text-xs text-slate-500 gap-2">
              <span className="font-medium text-primary">{order.worker_name}</span>
              •
              <span>{new Date(order.updated_at).toLocaleDateString()} {new Date(order.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
           </div>
           {order.details && <p className="text-xs text-slate-400 mt-1">{order.details}</p>}
         </div>
      </div>
      <div className="flex gap-2 sm:self-center ml-14 sm:ml-0 items-center">
         <Button variant="secondary" size="sm" onClick={onAction}>
            {actionIcon} {actionLabel}
         </Button>
         {isArchived && (
            <AlertDialog>
              <AlertDialogTrigger render={
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              } />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Permanen?</AlertDialogTitle>
                  <AlertDialogDescription>Data riwayat tidak dapat dikembalikan.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600">Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
         )}
      </div>
    </div>
  );
}
