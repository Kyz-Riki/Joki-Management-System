import { NextRequest } from 'next/server';
import { db } from '@/db';
import { owners, registrationAttempts } from '@/db/schema';
import { eq, gt, and, count } from 'drizzle-orm';
import { ok, err } from '@/lib/response';
import { registerSchema } from '@/lib/validations';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // 1. Get client IP
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

    // 2. Parse raw JSON — do NOT validate yet so we can check honeypot first.
    //    registerSchema defines honeypot as z.string().max(0).optional(), meaning a
    //    non-empty honeypot would fail schema validation before we can return ok() silently.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('VALIDATION_ERROR', 'Request body tidak valid.', 422);
    }

    // 3. Honeypot check — must happen before safeParse so bots always see "success"
    const rawBody = body as Record<string, unknown>;
    const honeypot = typeof rawBody?.honeypot === 'string' ? rawBody.honeypot : '';
    if (honeypot) {
      return ok({ message: 'Registrasi berhasil' });
    }

    // 4. Validate the rest of the body with Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Validation error';
      return err('VALIDATION_ERROR', message, 422);
    }

    const { username, email, password, turnstileToken } = parsed.data;

    // 5. Verify Cloudflare Turnstile
    const turnstileRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      },
    );
    const turnstileData = (await turnstileRes.json()) as { success: boolean };
    if (!turnstileData.success) {
      return err('TURNSTILE_FAILED', 'Verifikasi gagal.', 400);
    }

    // 6. Rate limiting — count registration attempts from this IP in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [{ count: attemptCount }] = await db
      .select({ count: count() })
      .from(registrationAttempts)
      .where(
        and(
          eq(registrationAttempts.ip_address, ip),
          gt(registrationAttempts.attempted_at, oneHourAgo),
        ),
      );

    if (Number(attemptCount) >= 3) {
      return err(
        'RATE_LIMITED',
        'Terlalu banyak percobaan pendaftaran. Coba lagi dalam 1 jam.',
        429,
      );
    }

    // 7. Record this attempt before any further checks
    await db.insert(registrationAttempts).values({ ip_address: ip });

    // 8. Check if username already exists
    const [existingOwner] = await db
      .select({ id: owners.id })
      .from(owners)
      .where(eq(owners.username, username))
      .limit(1);

    if (existingOwner) {
      return err('CONFLICT', 'Username sudah digunakan.', 409);
    }

    // 9. Create Supabase Auth user via service (admin) client
    const serviceClient = createServiceClient();
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      email_confirm: true,
    });

    // 10. Handle auth creation failure (e.g. email already registered)
    if (authError || !authData.user) {
      return err('CONFLICT', 'Email sudah terdaftar.', 409);
    }

    // 11. Persist owner profile in our own table
    await db.insert(owners).values({
      id: authData.user.id,
      username,
      email,
    });

    // 12. Sign the new user in immediately so we can return session tokens
    //     Use the regular server client (with cookies) so Supabase sets the
    //     session cookie automatically in addition to returning the tokens.
    const supabase = await createClient();
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !signInData.session) {
      // Registration succeeded — auto sign-in failed for some reason.
      // Return partial success; the client can prompt the user to log in.
      return ok({ message: 'Registrasi berhasil', user: { username } });
    }

    // 13. Return full success with session tokens
    return ok({
      message: 'Registrasi berhasil',
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      user: { username },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
