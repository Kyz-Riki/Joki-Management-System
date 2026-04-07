import { db } from '@/db';
import { orders, registrationAttempts } from '@/db/schema';
import { and, eq, lt } from 'drizzle-orm';
import { ok, err } from '@/lib/response';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return err('UNAUTHORIZED', 'Invalid cron secret.', 401);
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Archive DONE orders older than 30 days
    const archived = await db
      .update(orders)
      .set({ status: 'ARCHIVED', updated_at: new Date() })
      .where(and(eq(orders.status, 'DONE'), lt(orders.updated_at, thirtyDaysAgo)))
      .returning({ id: orders.id });

    // Cleanup old registration attempts (older than 24 hours)
    await db
      .delete(registrationAttempts)
      .where(lt(registrationAttempts.attempted_at, oneDayAgo));

    return ok({
      archived_count: archived.length,
      message: `Auto-archive berhasil. ${archived.length} order diarsipkan.`,
    });
  } catch (error) {
    console.error('[Cron Error]', error);
    return err('INTERNAL_ERROR', 'Terjadi kesalahan pada cron job.', 500);
  }
}
