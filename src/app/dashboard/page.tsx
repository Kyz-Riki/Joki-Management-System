"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api, Container } from "@/lib/api";
import { Users, Container as ContainerIcon, Clock, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardHome() {
  const { user } = useAuth();
  const [containers, setContainers] = useState<Container[]>([]);
  const [workersCount, setWorkersCount] = useState(0);
  const [doneOrders, setDoneOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const workersRes = await api.workers.list();
        setWorkersCount(workersRes.length);
        
        const containersRes = await api.containers.list();
        setContainers(containersRes);

        let doneCount = 0;
        for (const c of containersRes) {
          const orders = await api.orders.list(c.id);
          const todaysDone = orders.filter(o => {
             const isDone = o.status === "DONE";
             const isToday = new Date(o.updated_at).toDateString() === new Date().toDateString();
             return isDone && isToday;
          });
          doneCount += todaysDone.length;
        }
        setDoneOrders(doneCount);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalActiveOrders = containers.reduce((acc, c) => acc + c.active_orders_count, 0);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Selamat datang, {user?.username}</h1>
        <p className="text-slate-500">Berikut adalah ringkasan operasional joki Anda hari ini.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Worker Aktif</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workersCount}</div>
            <p className="text-xs text-slate-500">Maks. 20 worker</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buka Antrean</CardTitle>
            <ContainerIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{containers.length}</div>
            <p className="text-xs text-slate-500">Layanan game / Maks. 5</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Aktif</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveOrders}</div>
            <p className="text-xs text-slate-500">Semua container</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Selesai Hari Ini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{doneOrders}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Container Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {containers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Belum ada container antrean.
                  <div className="mt-4">
                    <Link href="/dashboard/containers">
                       <Button variant="outline">Buat Container Pertama</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                containers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-medium">{c.game_name}</p>
                      <p className="text-sm text-slate-500">
                        {c.active_orders_count} order aktif
                      </p>
                    </div>
                    <Link href={`/dashboard/containers/${c.id}`}>
                      <Button variant="secondary" size="sm">Kelola</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-[100px]" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-[50px] mb-2" /><Skeleton className="h-3 w-[100px]" /></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4"><CardHeader><Skeleton className="h-6 w-[150px]" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}
