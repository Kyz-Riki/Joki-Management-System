import { db } from "@/db";
import { containers, orders } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { err, ok } from "@/lib/response";
import { containerSchema } from "@/lib/validations";
import { getCurrentOwner } from "@/lib/auth";
import { countContainersByOwner } from "@/lib/db-helpers";
import { handleApiError } from "@/lib/errors";
import { GAME_LIST } from "@/lib/constants";

export async function GET() {
  try {
    const owner = await getCurrentOwner();

    const result = await db
      .select({
        id: containers.id,
        game_name: containers.game_name,
        game_code: containers.game_code,
        slug: containers.slug,
        is_active: containers.is_active,
        created_at: containers.created_at,
        active_orders_count: sql<number>`COALESCE(COUNT(CASE WHEN ${orders.status} IN ('QUEUE', 'PROGRESS') THEN 1 END), 0)::int`,
      })
      .from(containers)
      .leftJoin(orders, eq(orders.container_id, containers.id))
      .where(eq(containers.owner_id, owner.id))
      .groupBy(containers.id)
      .orderBy(desc(containers.created_at));

    const formatted = result.map((c) => ({
      id: c.id,
      game_name: c.game_name,
      game_code: c.game_code,
      slug: `/q/${c.slug}`,
      is_active: c.is_active,
      active_orders_count: c.active_orders_count,
      created_at: c.created_at,
    }));

    return ok({ containers: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await getCurrentOwner();

    const body = await request.json();
    const result = containerSchema.safeParse(body);
    if (!result.success) {
      return err(
        "VALIDATION_ERROR",
        result.error.issues[0]?.message ?? "Data tidak valid.",
        422,
      );
    }
    const { game_code } = result.data;

    const containerCount = await countContainersByOwner(owner.id);
    if (containerCount >= 5) {
      return err(
        "LIMIT_REACHED",
        "Batas maksimal 5 container telah tercapai.",
        400,
      );
    }

    // Check for duplicate game per owner
    const [existing] = await db
      .select({ id: containers.id })
      .from(containers)
      .where(
        and(
          eq(containers.owner_id, owner.id),
          eq(containers.game_code, game_code),
        ),
      )
      .limit(1);

    if (existing) {
      return err("CONFLICT", "Container untuk game ini sudah ada.", 409);
    }

    const game = GAME_LIST.find((g) => g.code === game_code);
    if (!game) {
      return err("VALIDATION_ERROR", "Game tidak valid.", 422);
    }

    // Slug stored without leading slash: "{username}/{game_code}"
    const slug = `${owner.username}/${game_code}`;

    const [container] = await db
      .insert(containers)
      .values({
        owner_id: owner.id,
        game_name: game.name,
        game_code,
        slug,
        is_active: true,
      })
      .returning();

    return ok(
      {
        container: {
          ...container,
          slug: `/q/${container.slug}`,
          active_orders_count: 0,
        },
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
