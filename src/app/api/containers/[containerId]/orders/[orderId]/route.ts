import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ok, err } from '@/lib/response';
import { handleApiError } from '@/lib/errors';
import { getCurrentOwner, assertContainerOwnership, assertOwnership } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ containerId: string; orderId: string }> }
) {
  try {
    const { containerId, orderId } = await params;
    const owner = await getCurrentOwner();
    await assertContainerOwnership(owner.id, containerId);

    const body = await request.json().catch(() => ({}));
    if (!body?.confirm) {
      return err('CONFIRMATION_REQUIRED', 'Konfirmasi diperlukan untuk menghapus order.', 400);
    }

    await assertOwnership(owner.id, orderId, 'orders');
    await db.delete(orders).where(eq(orders.id, orderId));

    return ok({ message: 'Order berhasil dihapus' });
  } catch (error) {
    return handleApiError(error);
  }
}
