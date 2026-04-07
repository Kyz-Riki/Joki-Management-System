import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { owners, workers, containers, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

export type Owner = {
  id: string;
  username: string;
  email: string;
};

/**
 * Gets the current authenticated owner from the Supabase session.
 * Throws UnauthorizedError if not authenticated.
 */
export async function getCurrentOwner(): Promise<Owner> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError("Sesi tidak valid. Silakan login kembali.");
  }

  // Get owner data from our owners table
  const [owner] = await db
    .select()
    .from(owners)
    .where(eq(owners.id, user.id))
    .limit(1);

  if (!owner) {
    throw new UnauthorizedError("Akun tidak ditemukan.");
  }

  return owner;
}

/**
 * Validates that a resource belongs to the given owner.
 * Throws ForbiddenError if not owned or not found.
 * MUST be called before any PUT, PATCH, DELETE operations.
 */
export async function assertOwnership(
  ownerId: string,
  resourceId: string,
  table: "workers" | "containers" | "orders",
): Promise<void> {
  if (table === "workers") {
    const [resource] = await db
      .select({ id: workers.id })
      .from(workers)
      .where(and(eq(workers.id, resourceId), eq(workers.owner_id, ownerId)))
      .limit(1);

    if (!resource) throw new ForbiddenError("Akses ditolak.");
  } else if (table === "containers") {
    const [resource] = await db
      .select({ id: containers.id })
      .from(containers)
      .where(
        and(eq(containers.id, resourceId), eq(containers.owner_id, ownerId)),
      )
      .limit(1);

    if (!resource) throw new ForbiddenError("Akses ditolak.");
  } else if (table === "orders") {
    // For orders, ownership is verified through the container
    const [resource] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(containers, eq(orders.container_id, containers.id))
      .where(and(eq(orders.id, resourceId), eq(containers.owner_id, ownerId)))
      .limit(1);

    if (!resource) throw new ForbiddenError("Akses ditolak.");
  }
}

/**
 * Validates that a container belongs to the given owner.
 * Returns the container data if valid.
 */
export async function assertContainerOwnership(
  ownerId: string,
  containerId: string,
) {
  const [container] = await db
    .select()
    .from(containers)
    .where(
      and(eq(containers.id, containerId), eq(containers.owner_id, ownerId)),
    )
    .limit(1);

  if (!container) throw new ForbiddenError("Akses ditolak.");
  return container;
}
