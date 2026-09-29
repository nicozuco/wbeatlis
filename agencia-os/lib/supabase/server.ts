import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { authCookieOptions, REMEMBER_COOKIE } from "@/lib/supabase/session";

export async function createClient(options?: { remember?: boolean }) {
  const cookieStore = await cookies();
  const remember = options?.remember ?? cookieStore.get(REMEMBER_COOKIE)?.value === "1";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              cookieStore.set(name, value, authCookieOptions(value, cookieOptions, remember));
            });
          } catch {
            // Server Components cannot write cookies. The root proxy refreshes
            // the session before rendering and persists any new tokens.
          }
        },
      },
    },
  );
}
