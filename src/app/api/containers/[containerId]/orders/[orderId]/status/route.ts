import { db } from "@/db";
import { orders, workers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ok, err } from "@/lib/response";
import { handleApiError } from "@/lib/errors";
import { getCurrentOwner, assertContainerOwnership } from "@/lib/auth";
import { countActiveOrders } from "@/lib/db-helpers";
import { statusActionSchema } from "@/lib/validations";

const VALID_TRANSITIONS: Record<string, { from: string; to: string }> = {
  process: { from: "QUEUE", to: "PROGRESS" },
  complete: { from: "PROGRESS", to: "DONE" },
  archive: { from: "DONE", to: "ARCHIVED" },
  reactivate: { from: "ARCHIVED", to: "QUEUE" },
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ containerId: string; orderId: string }> },
) {
  try {
    const { containerId, orderId } = await params;
    const owner = await getCurrentOwner();
    await assertContainerOwnership(owner.id, containerId);

    const body = await request.json();
    const parsed = statusActionSchema.safeParse(body);
    if (!parsed.success) {
      return err("VALIDATION_ERROR", parsed.error.issues[0].message, 422);
    }
    const { action } = parsed.data;

    // Get current order
    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.container_id, containerId)))
      .limit(1);

    if (!currentOrder) {
      return err("NOT_FOUND", "Order tidak ditemukan.", 404);
    }

    const transition = VALID_TRANSITIONS[action];
    if (!transition || currentOrder.status !== transition.from) {
      return err(
        "INVALID_TRANSITION",
        `Tidak dapat melakukan aksi '${action}' pada order dengan status '${currentOrder.status}'.`,
        400,
      );
    }

    // For reactivate, check active order limit
    if (action === "reactivate") {
      const activeCount = await countActiveOrders(containerId);
      if (activeCount >= 50) {
        return err(
          "LIMIT_REACHED",
          "Batas maksimal 50 order aktif telah tercapai.",
          400,
        );
      }
    }

    // Update status
    const [updatedOrder] = await db
      .update(orders)
      .set({ status: transition.to, updated_at: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    // Fetch worker name
    let workerName: string | null = null;
    if (updatedOrder.worker_id) {
      const [w] = await db
        .select({ name: workers.name })
        .from(workers)
        .where(eq(workers.id, updatedOrder.worker_id))
        .limit(1);
      workerName = w?.name ?? null;
    }

    return ok({ order: { ...updatedOrder, worker_name: workerName } });
  } catch (error) {
    return handleApiError(error);
  }
}
