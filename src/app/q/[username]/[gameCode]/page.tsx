"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, Container, Order } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Search, SearchX } from "lucide-react";
import { StatusBadge } from "@/components/queue/StatusBadge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Extend Order type locally to include uid for public queue
type PublicOrder = Order & { uid?: string };

export default function PublicQueuePage() {
  const params = useParams();
  const username = params.username as string;
  const gameCode = params.gameCode as string;

  const [container, setContainer] = useState<Container | null>(null);
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedUid, setHighlightedUid] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'not_found'>('idle');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // poll for real-time updates
    return () => clearInterval(interval);
  }, [username, gameCode]);

  async function loadData() {
    try {
      const data = await api.publicQueue.get(username, gameCode);

      if (data.status === "closed") {
        setContainer({
          id: "",
          game_name: data.container.game_name,
          game_code: gameCode,
          slug: `/q/${username}/${gameCode}`,
          is_active: false,
          active_orders_count: 0,
        });
        return;
      }

      // data.status === "open"
      setContainer({
        id: "",
        game_name: data.container.game_name,
        game_code: gameCode,
        slug: `/q/${username}/${gameCode}`,
        is_active: true,
        active_orders_count: data.stats?.total_queue ?? 0,
      });

      // Map public order format to Order type — uid included
      const mappedOrders: PublicOrder[] = (data.orders ?? []).map((o) => ({
        id: "",
        uid: o.uid,
        queue_number: o.queue_number,
        customer_name: o.censored_name,
        details: undefined,
        worker_id: null,
        worker_name: undefined,
        status: o.status as Order["status"],
        created_at: o.created_at,
        updated_at: o.created_at,
      }));

      // Sort: PROGRESS first, then QUEUE, then DONE — oldest first within same status
      const weight: Record<string, number> = { PROGRESS: 1, QUEUE: 2, DONE: 3 };
      mappedOrders.sort((a, b) => {
        const aw = weight[a.status] ?? 4;
        const bw = weight[b.status] ?? 4;
        if (aw !== bw) return aw - bw;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setOrders(mappedOrders);

      // Re-validate current search after data refresh
      if (searchQuery.length === 6) {
        const match = mappedOrders.find(o => o.uid === searchQuery);
        setHighlightedUid(match ? searchQuery : null);
        setSearchStatus(match ? 'found' : 'not_found');
      }
    } catch (error: any) {
      if (error.message === "NOT_FOUND") {
        setIsNotFound(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(raw: string) {
    // Normalisasi ke uppercase — satu titik kontrol
    const query = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setSearchQuery(query);

    if (query.length === 6) {
      const match = orders.find(o => o.uid === query);
      setHighlightedUid(match ? query : null);
      setSearchStatus(match ? 'found' : 'not_found');
    } else {
      setHighlightedUid(null);
      setSearchStatus('idle');
    }
  }

  // Find highlighted order's position info
  const highlightedOrder = highlightedUid
    ? orders.find(o => o.uid === highlightedUid)
    : null;
  const activeDisplayOrders = orders.filter(
    o => o.status === 'QUEUE' || o.status === 'PROGRESS'
  );
  const highlightedPosition = highlightedOrder && highlightedOrder.status !== 'DONE'
    ? activeDisplayOrders.findIndex(o => o.uid === highlightedUid) + 1
    : null;

  if (isLoading)
    return (
      <div className="p-8 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );

  if (isNotFound)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-20 w-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchX className="h-10 w-10 text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold">Toko Tidak Ditemukan</h1>
          <p className="text-slate-500">
            Pastikan link antrean yang kamu buka sudah benar. URL tidak tersedia
            atau sudah dihapus.
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button variant="outline">Kembali ke Beranda</Button>
            </Link>
          </div>
        </div>
      </div>
    );

  if (container && !container.is_active)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-20 w-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-amber-600 dark:text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">Antrean Sedang Tutup</h1>
          <p className="text-slate-500">
            Silakan hubungi pemilik joki ({username}) untuk informasi lebih
            lanjut mengenai kapan antrean akan dibuka kembali.
          </p>
        </div>
      </div>
    );

  const qOrders = orders.filter((o) => o.status === "QUEUE");
  const pOrders = orders.filter((o) => o.status === "PROGRESS");
  const dOrdersToday = orders.filter(
    (o) =>
      o.status === "DONE" &&
      new Date(o.updated_at).toDateString() === new Date().toDateString(),
  );

  const displayOrders = orders.filter(
    (o) =>
      o.status === "QUEUE" ||
      o.status === "PROGRESS" ||
      (o.status === "DONE" &&
        new Date(o.updated_at).toDateString() === new Date().toDateString()),
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
      <header className="bg-white dark:bg-slate-900 border-b py-6 px-4 mb-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">
              {username}
            </p>
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
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Menunggu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200">
                {qOrders.length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                Proses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">
                {pOrders.length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium text-green-600 dark:text-green-500 uppercase tracking-wider">
                Selesai (Hari Ini)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                {dOrdersToday.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
          <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="font-semibold text-lg">Daftar Antrean Publik</h2>
            <p className="text-xs text-slate-500">
              Nama disamarkan untuk menjaga privasi. Dikerjakan berdasarkan
              urutan.
            </p>
          </div>

          {/* SEARCH BOX */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="queue-search"
                placeholder="Masukkan kode antrean kamu (contoh: A3F9KL)"
                className="pl-9 uppercase tracking-widest font-mono"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                maxLength={6}
                autoComplete="off"
              />
            </div>

            {/* Search result panel */}
            {searchStatus === 'found' && highlightedOrder && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-1">
                <span className="text-xl">🎯</span>
                <div className="text-sm">
                  <p className="font-semibold text-primary">Antrean Kamu Ditemukan!</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    No. <span className="font-bold">#{highlightedOrder.queue_number}</span>
                    {' · '}Status: <span className="font-medium capitalize">{highlightedOrder.status === 'QUEUE' ? 'Menunggu' : highlightedOrder.status === 'PROGRESS' ? 'Sedang Diproses' : 'Selesai'}</span>
                    {highlightedPosition !== null && (
                      <> · Posisi ke-<span className="font-bold">{highlightedPosition}</span></>
                    )}
                  </p>
                </div>
              </div>
            )}

            {searchStatus === 'not_found' && searchQuery.length === 6 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 animate-in fade-in">
                <SearchX className="h-4 w-4 shrink-0" />
                Kode tidak ditemukan di antrean aktif.
              </div>
            )}
          </div>

          {displayOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Belum ada antrean masuk.
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">No.</TableHead>
                    <TableHead>Nama (IGN)</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Waktu Masuk
                    </TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayOrders.map((order, idx) => (
                    <TableRow
                      key={order.id || `${order.queue_number}-${idx}`}
                      className={cn(
                        order.uid === highlightedUid && 'bg-primary/10 ring-2 ring-primary ring-inset',
                        order.status === "PROGRESS" && order.uid !== highlightedUid && "bg-amber-50/30 dark:bg-amber-950/20"
                      )}
                    >
                      <TableCell className="font-bold text-slate-700 dark:text-slate-300">
                        #{order.queue_number}
                      </TableCell>
                      <TableCell className="font-medium text-base">
                        {order.customer_name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
        <p>
          Powered by{" "}
          <Link
            href="/"
            className="font-bold text-slate-500 hover:text-primary"
          >
            JokiFlow.
          </Link>
        </p>
      </div>
    </div>
  );
}
