import { db } from "@/db";
import { orders, workers } from "@/db/schema";
import { eq, and, inArray, sql, asc } from "drizzle-orm";
import { ok, err } from "@/lib/response";
import { handleApiError } from "@/lib/errors";
import { getCurrentOwner, assertContainerOwnership } from "@/lib/auth";
import { countActiveOrders } from "@/lib/db-helpers";
import { orderSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ containerId: string }> },
) {
  try {
    const { containerId } = await params;
    const owner = await getCurrentOwner();
    await assertContainerOwnership(owner.id, containerId);

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const statusFilter = statusParam ? statusParam.split(",") : null;

    const whereCondition = statusFilter
      ? and(
          eq(orders.container_id, containerId),
          inArray(orders.status, statusFilter),
        )
      : eq(orders.container_id, containerId);

    const result = await db
      .select({
        id: orders.id,
        queue_number: orders.queue_number,
        customer_name: orders.customer_name,
        details: orders.details,
        worker_id: orders.worker_id,
        worker_name: workers.name,
        status: orders.status,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
      })
      .from(orders)
      .leftJoin(workers, eq(orders.worker_id, workers.id))
      .where(whereCondition)
      .orderBy(
        sql`CASE WHEN ${orders.status} = 'PROGRESS' THEN 1 WHEN ${orders.status} = 'QUEUE' THEN 2 ELSE 3 END`,
        asc(orders.created_at),
      );

    return ok({ orders: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ containerId: string }> },
) {
  try {
    const { containerId } = await params;
    const owner = await getCurrentOwner();
    await assertContainerOwnership(owner.id, containerId);

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return err("VALIDATION_ERROR", parsed.error.issues[0].message, 422);
    }
    const { customer_name, details, worker_id } = parsed.data;

    const activeCount = await countActiveOrders(containerId);
    if (activeCount >= 50) {
      return err(
        "LIMIT_REACHED",
        "Batas maksimal 50 order aktif per container.",
        400,
      );
    }

    // Safe queue_number generation inside a transaction
    const newOrder = await db.transaction(async (tx) => {
      const maxResult = await tx.execute(
        sql`SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_num FROM orders WHERE container_id = ${containerId}`,
      );
      const nextNum = Number((maxResult as any)[0]?.next_num ?? 1);

      const [order] = await tx
        .insert(orders)
        .values({
          container_id: containerId,
          worker_id: worker_id,
          queue_number: nextNum,
          customer_name,
          details: details ?? null,
          status: "QUEUE",
        })
        .returning();

      return order;
    });

    // Fetch worker name for the response
    const [workerRecord] = await db
      .select({ name: workers.name })
      .from(workers)
      .where(eq(workers.id, worker_id))
      .limit(1);

    return ok(
      {
        order: {
          ...newOrder,
          worker_name: workerRecord?.name ?? null,
        },
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
