"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { assertAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE, REMEMBER_MAX_AGE } from "@/lib/supabase/session";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  remember: z.boolean(),
});

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(input: z.input<typeof loginSchema>): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa el email y la contraseña." };

  const { email, password, remember } = parsed.data;
  const supabase = await createClient({ remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, error: "El email o la contraseña no son correctos." };

  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/login");
}

// Cierra la sesión en todos los dispositivos (invalida todas las sesiones de la cuenta).
export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  revalidatePath("/", "layout");
  redirect("/login");
}

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(10, "La contraseña debe tener al menos 10 caracteres.")
      .regex(/[a-z]/, "Incluye una letra minúscula.")
      .regex(/[A-Z]/, "Incluye una letra mayúscula.")
      .regex(/[0-9]/, "Incluye un número.")
      .regex(/[^A-Za-z0-9]/, "Incluye un símbolo."),
    confirmation: z.string(),
  })
  .refine(({ password, confirmation }) => password === confirmation, {
    path: ["confirmation"],
    message: "Las contraseñas no coinciden.",
  });

export type PasswordResult = { ok: true } | { ok: false; error: string };

export async function changePassword(input: z.input<typeof passwordSchema>): Promise<PasswordResult> {
  const user = await assertAuthenticatedUser();
  if (!user) return { ok: false, error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };

  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa la contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "No se pudo actualizar la contraseña. Inténtalo de nuevo." };

  revalidatePath("/ajustes");
  return { ok: true };
}
