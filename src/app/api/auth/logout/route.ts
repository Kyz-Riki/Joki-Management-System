import { ok } from '@/lib/response';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';

export async function POST() {
  try {
    // createClient() uses the @supabase/ssr server client which reads the
    // session from cookies and will clear those cookies on signOut().
    const supabase = await createClient();

    await supabase.auth.signOut();

    return ok({ message: 'Logout berhasil' });
  } catch (error) {
    return handleApiError(error);
  }
}
