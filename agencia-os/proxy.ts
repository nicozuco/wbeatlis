import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Fuera del login: estáticos, el service worker y el manifiesto (el navegador los
// pide sin sesión) y la ruta que llama pg_cron, que se protege con su propio secreto.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|api/reminders/dispatch|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
