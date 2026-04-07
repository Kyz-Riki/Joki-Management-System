import { ok } from '@/lib/response';
import { GAME_LIST } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { containers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    // Attempt to read the current session — no error thrown if not logged in.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Query which game codes this owner already has a container for.
      const ownerContainers = await db
        .select({ gameCode: containers.game_code })
        .from(containers)
        .where(eq(containers.owner_id, user.id));

      const usedCodes = ownerContainers.map((c) => c.gameCode);

      // Annotate every game with an already_used flag.
      const games = GAME_LIST.map((g) => ({
        ...g,
        already_used: usedCodes.includes(g.code),
      }));

      return ok({ games });
    }

    // Unauthenticated — return plain list with no flags.
    return ok({ games: GAME_LIST });
  } catch (error) {
    return handleApiError(error);
  }
}
