import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_COOKIE = "agencia-remember";
export const REMEMBERED_EMAIL_KEY = "agencia-remembered-email";
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

export function authCookieOptions(value: string, options: CookieOptions, remember: boolean): CookieOptions {
  if (!value || options.maxAge === 0) return options;
  const sessionOptions = { ...options };
  delete sessionOptions.maxAge;
  return remember ? { ...sessionOptions, maxAge: REMEMBER_MAX_AGE } : sessionOptions;
}
