import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/user-settings";

// Inicio: la página elegida en Ajustes → Menú e inicio (Hoy por defecto).
export default async function WorkspaceHome() {
  const user = await requireAuthenticatedUser();
  const { startPage } = await getUserSettings(user.id);
  redirect(startPage);
}
