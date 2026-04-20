

export type Worker = { id: string; name: string; created_at: string };
export type Container = {
  id: string;
  game_name: string;
  game_code: string;
  slug: string;
  is_active: boolean;
  active_orders_count: number;
};
export type DashboardSummary = {
  workers_count: number;
  containers: Container[];
  done_today: number;
  total_active_orders: number;
};
export type Order = {
  id: string;
  uid?: string;
  queue_number: number;
  customer_name: string;
  details?: string;
  worker_id: string | null;
  worker_name?: string;
  status: "QUEUE" | "PROGRESS" | "DONE" | "ARCHIVED";
  created_at: string;
  updated_at: string;
};

// Helper to handle API responses
async function apiFetch(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const json = await res.json();
  if (!json.success) {
    const error = new Error(json.error?.message || "Terjadi kesalahan");
    (error as any).code = json.error?.code;
    throw error;
  }
  return json.data;
}

export const api = {
  dashboard: {
    summary: async (): Promise<DashboardSummary> => {
      return apiFetch("/api/dashboard/summary");
    },
  },
  workers: {
    list: async (): Promise<Worker[]> => {
      const data = await apiFetch("/api/workers");
      return data.workers;
    },
    create: async (name: string): Promise<Worker> => {
      const data = await apiFetch("/api/workers", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      return data.worker;
    },
    update: async (id: string, name: string): Promise<Worker> => {
      const data = await apiFetch(`/api/workers/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      return data.worker;
    },
    delete: async (id: string): Promise<void> => {
      await apiFetch(`/api/workers/${id}`, { method: "DELETE" });
    },
  },
  containers: {
    list: async (): Promise<Container[]> => {
      const data = await apiFetch("/api/containers");
      return data.containers;
    },
    create: async (game_name: string): Promise<Container> => {
      const data = await apiFetch("/api/containers", {
        method: "POST",
        body: JSON.stringify({ game_name }),
      });
      return data.container;
    },
    toggleActive: async (id: string): Promise<Container> => {
      const data = await apiFetch(`/api/containers/${id}/toggle`, {
        method: "PATCH",
      });
      return data.container;
    },
    delete: async (id: string): Promise<void> => {
      await apiFetch(`/api/containers/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ confirm: true }),
      });
    },
  },
  orders: {
    list: async (
      containerId: string,
      statusFilter?: string,
    ): Promise<Order[]> => {
      const url = statusFilter
        ? `/api/containers/${containerId}/orders?status=${statusFilter}`
        : `/api/containers/${containerId}/orders`;
      const data = await apiFetch(url);
      return data.orders;
    },
    create: async (
      containerId: string,
      customer_name: string,
      details: string,
      worker_id: string,
    ): Promise<Order> => {
      const data = await apiFetch(`/api/containers/${containerId}/orders`, {
        method: "POST",
        body: JSON.stringify({ customer_name, details, worker_id }),
      });
      return data.order;
    },
    updateStatus: async (
      containerId: string,
      orderId: string,
      status: Order["status"],
    ): Promise<Order | undefined> => {
      // Map status strings to action strings for the backend
      const actionMap: Record<string, string> = {
        PROGRESS: "process",
        DONE: "complete",
        ARCHIVED: "archive",
        QUEUE: "reactivate",
      };
      const action = actionMap[status];
      if (!action) throw new Error("Invalid status");

      const data = await apiFetch(
        `/api/containers/${containerId}/orders/${orderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ action }),
        },
      );
      return data.order;
    },
    delete: async (containerId: string, orderId: string): Promise<void> => {
      await apiFetch(`/api/containers/${containerId}/orders/${orderId}`, {
        method: "DELETE",
        body: JSON.stringify({ confirm: true }),
      });
    },
  },
  publicQueue: {
    get: async (
      username: string,
      gameCode: string,
    ): Promise<{
      status: "open" | "closed";
      container: { game_name: string; username: string };
      orders?: Array<{
        uid: string;
        queue_number: number;
        censored_name: string;
        status: string;
        created_at: string;
      }>;
      stats?: {
        total_queue: number;
        total_progress: number;
        done_today: number;
      };
      message?: string;
    }> => {
      const res = await fetch(`/api/public/queue/${username}/${gameCode}`);
      const json = await res.json();
      if (!json.success && json.error?.code !== "NOT_FOUND") {
        throw new Error(json.error?.message || "Terjadi kesalahan");
      }
      if (!json.success) {
        throw new Error("NOT_FOUND");
      }
      return json.data;
    },
  },
};
