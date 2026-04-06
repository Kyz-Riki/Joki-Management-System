import { GAME_LIST } from "@/lib/constants";

export type Worker = { id: string, name: string, created_at: string };
export type Container = { id: string, game_name: string, game_code: string, slug: string, is_active: boolean, active_orders_count: number };
export type Order = { id: string, queue_number: number, customer_name: string, details?: string, worker_id: string | null, worker_name?: string, status: "QUEUE" | "PROGRESS" | "DONE" | "ARCHIVED", created_at: string, updated_at: string };

// Dummy Data
let mockWorkers: Worker[] = [
  { id: "w1", name: "Rina (Mage)", created_at: new Date().toISOString() },
  { id: "w2", name: "Budi (Jungler)", created_at: new Date().toISOString() },
];

let mockContainers: Container[] = [
  { id: "c1", game_name: "Mobile Legends: Bang Bang", game_code: "mlbb", slug: "/q/izumi-store/mlbb", is_active: true, active_orders_count: 2 },
];

let mockOrders: Record<string, Order[]> = {
  "c1": [
    { id: "o1", queue_number: 1, customer_name: "Rafi Ahmad", details: "Mythic Glory 50x", worker_id: "w1", worker_name: "Rina (Mage)", status: "PROGRESS", created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date().toISOString() },
    { id: "o2", queue_number: 2, customer_name: "Reza Rahadian", details: "Legend V to Mythic", worker_id: "w2", worker_name: "Budi (Jungler)", status: "QUEUE", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "o3", queue_number: 3, customer_name: "Bagas", details: "Epic", worker_id: "w1", worker_name: "Rina (Mage)", status: "DONE", created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  ]
};

const requireDelay = () => new Promise(r => setTimeout(r, 600));

export const api = {
  workers: {
    list: async () => { await requireDelay(); return [...mockWorkers]; },
    create: async (name: string) => { await requireDelay(); const w = { id: Math.random().toString(), name, created_at: new Date().toISOString() }; mockWorkers.push(w); return w; },
    update: async (id: string, name: string) => { await requireDelay(); const w = mockWorkers.find(x => x.id === id); if (w) w.name = name; return w; },
    delete: async (id: string) => { await requireDelay(); mockWorkers = mockWorkers.filter(x => x.id !== id); }
  },
  containers: {
    list: async () => { await requireDelay(); return [...mockContainers]; },
    create: async (game_code: string, username: string) => { 
       await requireDelay(); 
       const game = GAME_LIST.find(g => g.code === game_code);
       if (!game) throw new Error("Game not found");
       const c = { id: Math.random().toString(), game_name: game.name, game_code, slug: `/q/${username}/${game_code}`, is_active: true, active_orders_count: 0 };
       mockContainers.push(c);
       mockOrders[c.id] = [];
       return c;
    },
    toggleActive: async (id: string) => { await requireDelay(); const c = mockContainers.find(x => x.id === id); if (c) c.is_active = !c.is_active; return c; },
    delete: async (id: string) => { await requireDelay(); mockContainers = mockContainers.filter(x => x.id !== id); delete mockOrders[id]; }
  },
  orders: {
    list: async (containerId: string) => { await requireDelay(); return [...(mockOrders[containerId] || [])]; },
    create: async (containerId: string, customer_name: string, details: string, worker_id: string) => {
      await requireDelay();
      if (!mockOrders[containerId]) mockOrders[containerId] = [];
      const worker = mockWorkers.find(w => w.id === worker_id);
      const queue_number = mockOrders[containerId].length + 1;
      const o: Order = { id: Math.random().toString(), queue_number, customer_name, details, worker_id, worker_name: worker?.name, status: "QUEUE", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mockOrders[containerId].push(o);
      const c = mockContainers.find(x => x.id === containerId);
      if (c) c.active_orders_count++;
      return o;
    },
    updateStatus: async (containerId: string, orderId: string, status: Order["status"]) => {
      await requireDelay();
      const o = mockOrders[containerId]?.find(x => x.id === orderId);
      if (o) {
        if ((o.status === "QUEUE" || o.status === "PROGRESS") && (status === "DONE" || status === "ARCHIVED")) {
           const c = mockContainers.find(x => x.id === containerId);
           if (c && c.active_orders_count > 0) c.active_orders_count--;
        } else if ((o.status === "DONE" || o.status === "ARCHIVED") && (status === "QUEUE" || status === "PROGRESS")) {
           const c = mockContainers.find(x => x.id === containerId);
           if (c) c.active_orders_count++;
        }
        o.status = status;
        o.updated_at = new Date().toISOString();
      }
      return o;
    },
    delete: async (containerId: string, orderId: string) => {
      await requireDelay();
      mockOrders[containerId] = mockOrders[containerId]?.filter(x => x.id !== orderId);
    }
  }
};
