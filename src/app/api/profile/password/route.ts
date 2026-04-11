import { ok, err } from "@/lib/response";
import { changePasswordSchema } from "@/lib/validations";
import { getCurrentOwner } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    // Pastikan user sudah login
    await getCurrentOwner();

    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return err(
        "VALIDATION_ERROR",
        result.error.issues[0]?.message ?? "Data tidak valid.",
        422,
      );
    }

    const { current_password, new_password } = result.data;

    const supabase = await createClient();

    // Ambil email user saat ini untuk re-authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return err("UNAUTHORIZED", "Sesi tidak valid. Silakan login kembali.", 401);
    }

    // Verifikasi current_password dengan cara sign-in ulang (best practice keamanan)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    });

    if (signInError) {
      return err(
        "INVALID_PASSWORD",
        "Password saat ini tidak valid.",
        400,
      );
    }

    // Pastikan password baru berbeda dari password lama
    if (current_password === new_password) {
      return err(
        "CONFLICT",
        "Password baru tidak boleh sama dengan password saat ini.",
        409,
      );
    }

    // Update password via Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      return err("AUTH_ERROR", updateError.message, 400);
    }

    // Refresh session agar cookie server perbarui token
    await supabase.auth.refreshSession();

    return ok({
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
