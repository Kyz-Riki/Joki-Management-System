import { db } from '@/db';
import { orders, containers } from '@/db/schema';
import { eq, and, inArray, sql, asc } from 'drizzle-orm';
import { ok, err } from '@/lib/response';

function censorName(name: string): string {
  if (name.length <= 4) return name[0] + '***';
  return name.slice(0, 2) + '***' + name.slice(-2);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; gameCode: string }> }
) {
  try {
    const { username, gameCode } = await params;
    const slug = `${username}/${gameCode}`;

    // Find container by slug
    const [container] = await db
      .select()
      .from(containers)
      .where(eq(containers.slug, slug))
      .limit(1);

    if (!container) {
      return err('NOT_FOUND', 'Antrean tidak ditemukan.', 404);
    }

    if (!container.is_active) {
      return ok({
        status: 'closed',
        message: 'Antrean sedang tutup',
        container: { game_name: container.game_name, username },
      });
    }

    // Fetch active + today's done orders
    const allOrders = await db
      .select({
        queue_number: orders.queue_number,
        customer_name: orders.customer_name,
        status: orders.status,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
      })
      .from(orders)
      .where(
        and(
          eq(orders.container_id, container.id),
          inArray(orders.status, ['QUEUE', 'PROGRESS', 'DONE'])
        )
      )
      .orderBy(
        sql`CASE WHEN ${orders.status} = 'PROGRESS' THEN 1 WHEN ${orders.status} = 'QUEUE' THEN 2 ELSE 3 END`,
        asc(orders.created_at)
      );

    const today = new Date().toDateString();
    const doneToday = allOrders.filter(
      o => o.status === 'DONE' && o.updated_at && new Date(o.updated_at).toDateString() === today
    );

    // Only include QUEUE, PROGRESS, and today's DONE
    const displayOrders = allOrders.filter(
      o => o.status === 'QUEUE' || o.status === 'PROGRESS' ||
        (o.status === 'DONE' && o.updated_at && new Date(o.updated_at).toDateString() === today)
    );

    // Censor names server-side — NEVER expose real names publicly
    const publicOrders = displayOrders.map(o => ({
      queue_number: o.queue_number,
      censored_name: censorName(o.customer_name),
      status: o.status,
      created_at: o.created_at,
    }));

    const stats = {
      total_queue: allOrders.filter(o => o.status === 'QUEUE').length,
      total_progress: allOrders.filter(o => o.status === 'PROGRESS').length,
      done_today: doneToday.length,
    };

    return ok({
      status: 'open',
      container: { game_name: container.game_name, username },
      orders: publicOrders,
      stats,
    });
  } catch (error) {
    console.error('[Public Queue Error]', error);
    return err('INTERNAL_ERROR', 'Terjadi kesalahan internal.', 500);
  }
}
