import { db } from "@/db";
import { workers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ok, err } from "@/lib/response";
import { workerSchema } from "@/lib/validations";
import { getCurrentOwner } from "@/lib/auth";
import { countWorkersByOwner } from "@/lib/db-helpers";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const owner = await getCurrentOwner();

    const workerList = await db
      .select()
      .from(workers)
      .where(eq(workers.owner_id, owner.id))
      .orderBy(desc(workers.created_at));

    return ok({ workers: workerList });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await getCurrentOwner();

    const body = await request.json();
    const result = workerSchema.safeParse(body);
    if (!result.success) {
      return err(
        "VALIDATION_ERROR",
        result.error.issues[0]?.message ?? "Data tidak valid.",
        422,
      );
    }
    const { name } = result.data;

    const workerCount = await countWorkersByOwner(owner.id);
    if (workerCount >= 20) {
      return err(
        "LIMIT_REACHED",
        "Batas maksimal 20 worker telah tercapai.",
        400,
      );
    }

    const [worker] = await db
      .insert(workers)
      .values({ owner_id: owner.id, name })
      .returning();

    return ok({ worker }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
