import { db } from "@/db";
import { containers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ok } from "@/lib/response";
import { getCurrentOwner, assertOwnership } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ containerId: string }> },
) {
  try {
    const { containerId } = await params;
    const owner = await getCurrentOwner();

    await assertOwnership(owner.id, containerId, "containers");

    // Flip is_active in a single UPDATE … RETURNING — no extra SELECT needed
    const [updated] = await db
      .update(containers)
      .set({ is_active: sql`NOT ${containers.is_active}` })
      .where(eq(containers.id, containerId))
      .returning();

    return ok({
      container: {
        ...updated,
        // Stored slug is "{username}/{game_code}"; API always returns with /q/ prefix
        slug: `/q/${updated.slug}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
