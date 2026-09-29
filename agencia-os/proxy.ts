import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Fuera del login: estáticos, el service worker y el manifiesto (el navegador los
// pide sin sesión), la ruta que llama pg_cron y la que recibe las visitas a las
// propuestas (ambas se protegen con su propio secreto) y el contador público de
// visitas de las webs (api/t, que solo acepta los orígenes de Atlis).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|api/reminders/dispatch|api/propuestas/evento|api/t$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
