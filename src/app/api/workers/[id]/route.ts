import { db } from "@/db";
import { workers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/response";
import { workerSchema } from "@/lib/validations";
import { getCurrentOwner, assertOwnership } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const owner = await getCurrentOwner();

    await assertOwnership(owner.id, id, "workers");

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

    const [worker] = await db
      .update(workers)
      .set({ name })
      .where(eq(workers.id, id))
      .returning();

    return ok({ worker });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const owner = await getCurrentOwner();

    await assertOwnership(owner.id, id, "workers");

    await db.delete(workers).where(eq(workers.id, id));

    return ok({ message: "Worker berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
