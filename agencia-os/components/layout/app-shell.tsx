"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Settings2, UserRound } from "lucide-react";

import { signOut } from "@/app/auth/actions";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WebMcpTools } from "@/components/webmcp-tools";
import { BrandMark } from "@/components/shared/brand-mark";
import { GuardedLink, UnsavedChangesProvider, useUnsavedChanges } from "@/components/shared/unsaved-changes";
import { visibleNavigation } from "@/lib/navigation";
import { appearanceAttributes, applyAppearance, initialsOf, type UserSettings } from "@/lib/preferences";


// Cerrar sesión también pasa por el aviso de cambios sin guardar.
function SignOutForm({ className, children }: { className?: string; children: React.ReactNode }) {
  const { hasUnsavedChanges, confirmLeave } = useUnsavedChanges();
  const confirmed = useRef(false);
  return (
    <form
      action={signOut}
      className={className}
      onSubmit={(event) => {
        if (confirmed.current || !hasUnsavedChanges()) return;
        event.preventDefault();
        const form = event.currentTarget;
        confirmLeave(() => { confirmed.current = true; form.requestSubmit(); });
      }}
    >
      {children}
    </form>
  );
}

export function AppShell({ children, userEmail, settings }: { children: React.ReactNode; userEmail: string | null; settings: UserSettings }) {
  const pathname = usePathname() ?? "";
  // Orden y apartados ocultos elegidos en Ajustes.
  const navigation = visibleNavigation(settings.navigation);
  const accountLabel = settings.displayName ?? userEmail ?? "cuenta";

  // La apariencia guardada en la cuenta manda: si este dispositivo tenía otra
  // (cookie de otra sesión o de antes de cambiarla en otro dispositivo), se corrige.
  const { appearance } = settings;
  useEffect(() => {
    const root = document.documentElement;
    if (Object.entries(appearanceAttributes(appearance)).some(([name, value]) => root.getAttribute(name) !== value)) applyAppearance(appearance);
  }, [appearance]);

  return (
    <TooltipProvider delayDuration={300}>
      <UnsavedChangesProvider>
        <WebMcpTools />
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center border-r border-border bg-surface md:flex">
          <GuardedLink href="/" aria-label="Atlis — Inicio" className="flex h-16 w-full items-center justify-center border-b border-border">
            <BrandMark className="size-10" />
          </GuardedLink>
          <nav aria-label="Navegación principal" className="flex flex-1 flex-col items-center gap-2 py-4">
            {navigation.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <GuardedLink
                      href={href}
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                      className={`grid size-10 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-raised hover:text-text ${active ? "bg-accent-soft text-accent" : ""}`}
                    >
                      <Icon className="size-[18px]" strokeWidth={1.8} />
                    </GuardedLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="border border-border bg-surface-raised text-text">
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
          <div className="mb-4 flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <GuardedLink
                  href="/ajustes"
                  aria-label="Ajustes de la cuenta"
                  aria-current={pathname === "/ajustes" ? "page" : undefined}
                  className={`grid size-10 place-items-center rounded-lg border border-border bg-surface-raised text-text-muted transition-colors hover:border-border-strong hover:text-text ${pathname === "/ajustes" ? "border-accent/40 bg-accent-soft text-accent" : ""}`}
                >
                  {settings.displayName ? <span className="font-heading text-xs font-semibold tracking-wide">{initialsOf(settings.displayName, userEmail)}</span> : <UserRound className="size-[17px]" strokeWidth={1.8} />}
                </GuardedLink>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="border border-border bg-surface-raised text-text">Ajustes · {accountLabel}</TooltipContent>
            </Tooltip>
            <SignOutForm>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="submit" aria-label="Cerrar sesión" className="grid size-10 place-items-center rounded-lg text-text-muted transition-colors hover:bg-danger/10 hover:text-danger">
                    <LogOut className="size-[18px]" strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="border border-border bg-surface-raised text-text">Cerrar sesión</TooltipContent>
              </Tooltip>
            </SignOutForm>
          </div>
        </aside>

        <nav aria-label="Navegación móvil" className="scrollbar-none fixed inset-x-0 bottom-0 z-40 flex h-16 items-center gap-1 overflow-x-auto border-t border-border bg-surface px-2 md:hidden">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <GuardedLink
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`grid size-11 shrink-0 place-items-center rounded-lg text-text-muted ${active ? "bg-accent-soft text-accent" : ""}`}
              >
                <Icon className="size-5" strokeWidth={1.8} />
              </GuardedLink>
            );
          })}
          <GuardedLink
            href="/ajustes"
            aria-label="Ajustes"
            aria-current={pathname === "/ajustes" ? "page" : undefined}
            className={`grid size-11 shrink-0 place-items-center rounded-lg text-text-muted ${pathname === "/ajustes" ? "bg-accent-soft text-accent" : ""}`}
          >
            <Settings2 className="size-5" strokeWidth={1.8} />
          </GuardedLink>
          <SignOutForm className="shrink-0">
            <button type="submit" aria-label="Cerrar sesión" className="grid size-11 place-items-center rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger">
              <LogOut className="size-5" strokeWidth={1.8} />
            </button>
          </SignOutForm>
        </nav>

        <main className="min-h-screen pb-24 md:ml-16 md:pb-10">
          <div className="mx-auto w-full max-w-[1400px] px-5 py-7 sm:px-8 sm:py-9">{children}</div>
        </main>
      </UnsavedChangesProvider>
    </TooltipProvider>
  );
}
