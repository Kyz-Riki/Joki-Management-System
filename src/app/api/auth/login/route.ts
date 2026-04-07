import { NextRequest } from 'next/server';
import { db } from '@/db';
import { owners } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ok, err } from '@/lib/response';
import { loginSchema } from '@/lib/validations';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('VALIDATION_ERROR', 'Request body tidak valid.', 422);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Validation error';
      return err('VALIDATION_ERROR', message, 422);
    }

    const { username, password } = parsed.data;

    // 2. Look up the owner record by username to retrieve their email.
    //    We use email (not username) as the Supabase Auth identity.
    const [owner] = await db
      .select()
      .from(owners)
      .where(eq(owners.username, username))
      .limit(1);

    // 3. Username not found — return a generic credential error to avoid
    //    leaking whether the username or password was wrong.
    if (!owner) {
      return err('INVALID_CREDENTIALS', 'Username atau password salah.', 401);
    }

    // 4. Create the server-side Supabase client (reads/writes cookies automatically).
    const supabase = await createClient();

    // 5. Attempt sign-in with the email associated with this username.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: owner.email,
      password,
    });

    // 6. Wrong password or any other auth error — same generic message.
    if (error || !data.session) {
      return err('INVALID_CREDENTIALS', 'Username atau password salah.', 401);
    }

    // 7. Success — session cookie was set by createServerClient automatically.
    //    Also return the raw tokens so the browser client can call setSession().
    return ok({
      user: { username: owner.username },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
