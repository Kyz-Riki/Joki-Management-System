import { db } from "@/db";
import { owners } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/response";
import { updateProfileSchema } from "@/lib/validations";
import { getCurrentOwner } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    const owner = await getCurrentOwner();

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return err(
        "VALIDATION_ERROR",
        result.error.issues[0]?.message ?? "Data tidak valid.",
        422,
      );
    }

    const { email } = result.data;

    // Hanya email yang diupdate saat ini
    if (!email) {
      return err(
        "VALIDATION_ERROR",
        "Email diperlukan untuk pembaruan profil.",
        422,
      );
    }

    // Pastikan email baru tidak sama dengan email lama
    if (email === owner.email) {
      return err(
        "CONFLICT",
        "Email baru tidak boleh sama dengan email saat ini.",
        409,
      );
    }

    // Pastikan email belum dipakai owner lain
    const [existing] = await db
      .select({ id: owners.id })
      .from(owners)
      .where(eq(owners.email, email))
      .limit(1);

    if (existing) {
      return err("CONFLICT", "Email sudah digunakan oleh akun lain.", 409);
    }

    // Update email di Supabase Auth
    // Supabase akan mengirim email konfirmasi ke alamat baru (& lama jika Secure Email Change aktif)
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.updateUser({ email });

    if (authError) {
      // Jika error karena email konfirmasi perlu dikirim dulu, anggap sukses (pending)
      if (authError.message?.toLowerCase().includes("confirmation")) {
        return ok({
          message:
            "Email konfirmasi telah dikirim. Silakan cek kotak masuk Anda untuk memverifikasi email baru.",
          pending: true,
        });
      }
      return err("AUTH_ERROR", authError.message, 400);
    }

    // Sinkronisasi email ke tabel public.owners
    await db
      .update(owners)
      .set({ email })
      .where(eq(owners.id, owner.id));

    // Refresh session agar cookie server berisi data terbaru
    await supabase.auth.refreshSession();

    return ok({
      message:
        "Email berhasil diperbarui. Cek kotak masuk Anda jika diperlukan konfirmasi.",
      pending: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
