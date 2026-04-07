import { db } from "@/db";
import { containers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/response";
import { getCurrentOwner, assertOwnership } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ containerId: string }> },
) {
  try {
    const { containerId } = await params;

    // Require explicit confirmation in the request body
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Body is empty or not valid JSON — treat as missing confirmation
    }

    if (!body.confirm) {
      return err(
        "CONFIRMATION_REQUIRED",
        "Konfirmasi diperlukan untuk menghapus container.",
        400,
      );
    }

    const owner = await getCurrentOwner();
    await assertOwnership(owner.id, containerId, "containers");

    // Orders are deleted automatically via ON DELETE CASCADE on container_id FK
    await db.delete(containers).where(eq(containers.id, containerId));

    return ok({ message: "Container berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
