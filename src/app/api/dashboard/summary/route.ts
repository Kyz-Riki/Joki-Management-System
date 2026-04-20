import { db } from "@/db";
import { containers, orders, workers } from "@/db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { ok } from "@/lib/response";
import { getCurrentOwner } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const owner = await getCurrentOwner();

    // Ambil semua data yang dibutuhkan dashboard dalam 2 query paralel:
    // Query 1: Containers + active order count + done today count (JOIN single pass)
    // Query 2: Total workers count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [containersResult, workersResult] = await Promise.all([
      db
        .select({
          id: containers.id,
          game_name: containers.game_name,
          game_code: containers.game_code,
          slug: containers.slug,
          is_active: containers.is_active,
          created_at: containers.created_at,
          active_orders_count: sql<number>`COALESCE(COUNT(CASE WHEN ${orders.status} IN ('QUEUE', 'PROGRESS') THEN 1 END), 0)::int`,
          done_today_count: sql<number>`COALESCE(COUNT(CASE WHEN ${orders.status} = 'DONE' AND ${orders.updated_at} >= ${today.toISOString()} THEN 1 END), 0)::int`,
        })
        .from(containers)
        .leftJoin(orders, eq(orders.container_id, containers.id))
        .where(eq(containers.owner_id, owner.id))
        .groupBy(containers.id),

      db
        .select({ value: count() })
        .from(workers)
        .where(eq(workers.owner_id, owner.id)),
    ]);

    // Hitung total dari hasil query
    const totalDoneToday = containersResult.reduce(
      (sum, c) => sum + c.done_today_count,
      0,
    );

    const formattedContainers = containersResult.map((c) => ({
      id: c.id,
      game_name: c.game_name,
      game_code: c.game_code,
      slug: `/q/${c.slug}`,
      is_active: c.is_active,
      active_orders_count: c.active_orders_count,
      created_at: c.created_at,
    }));

    return ok({
      workers_count: workersResult[0]?.value ?? 0,
      containers: formattedContainers,
      done_today: totalDoneToday,
      total_active_orders: containersResult.reduce(
        (sum, c) => sum + c.active_orders_count,
        0,
      ),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
