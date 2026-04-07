import { db } from "@/db";
import { workers, containers, orders } from "@/db/schema";
import { and, eq, count, inArray } from "drizzle-orm";

/** Count workers owned by a specific owner */
export async function countWorkersByOwner(ownerId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(workers)
    .where(eq(workers.owner_id, ownerId));
  return result?.count ?? 0;
}

/** Count containers owned by a specific owner */
export async function countContainersByOwner(ownerId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(containers)
    .where(eq(containers.owner_id, ownerId));
  return result?.count ?? 0;
}

/** Count active orders (QUEUE or PROGRESS) in a container */
export async function countActiveOrders(containerId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.container_id, containerId),
        inArray(orders.status, ["QUEUE", "PROGRESS"]),
      ),
    );
  return result?.count ?? 0;
}

/** Count history orders (DONE or ARCHIVED) in a container */
export async function countOrderHistory(containerId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.container_id, containerId),
        inArray(orders.status, ["DONE", "ARCHIVED"]),
      ),
    );
  return result?.count ?? 0;
}
