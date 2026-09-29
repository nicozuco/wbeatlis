"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type UnsavedGuard = { isDirty: () => boolean; save: () => Promise<boolean> };

type UnsavedChangesValue = {
  setGuard: (guard: UnsavedGuard | null) => void;
  hasUnsavedChanges: () => boolean;
  confirmLeave: (proceed: () => void) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesValue>({
  setGuard: () => {},
  hasUnsavedChanges: () => false,
  confirmLeave: (proceed) => proceed(),
});

// Aviso común antes de abandonar una vista con cambios sin guardar (hoy, el
// mapa mental). La vista registra su guardia con useUnsavedGuard y toda
// navegación interna pasa por confirmLeave, que pregunta guardar / descartar /
// cancelar si hay cambios. El cierre de pestaña lo cubre beforeunload en la vista.
export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const guardRef = useRef<UnsavedGuard | null>(null);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [saving, setSaving] = useState(false);

  const setGuard = useCallback((guard: UnsavedGuard | null) => { guardRef.current = guard; }, []);
  const hasUnsavedChanges = useCallback(() => guardRef.current?.isDirty() ?? false, []);
  const confirmLeave = useCallback((proceed: () => void) => {
    if (guardRef.current?.isDirty()) setPendingLeave(() => proceed);
    else proceed();
  }, []);

  const leave = () => {
    const proceed = pendingLeave;
    setPendingLeave(null);
    proceed?.();
  };

  const saveAndLeave = async () => {
    if (!guardRef.current) return leave();
    setSaving(true);
    const saved = await guardRef.current.save();
    setSaving(false);
    if (saved) leave();
    else setPendingLeave(null);
  };

  const value = useMemo(() => ({ setGuard, hasUnsavedChanges, confirmLeave }), [setGuard, hasUnsavedChanges, confirmLeave]);

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <AlertDialog open={pendingLeave !== null} onOpenChange={(open) => { if (!open && !saving) setPendingLeave(null); }}>
        <AlertDialogContent className="border-border bg-surface-raised text-text">
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription className="text-text-muted">Hay cambios en el mapa que todavía no se han guardado. ¿Qué quieres hacer antes de salir?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => setPendingLeave(null)} className="border-border bg-surface text-text">Cancelar</Button>
            <Button type="button" variant="ghost" disabled={saving} onClick={leave} className="text-danger hover:bg-danger/10 hover:text-danger">Descartar</Button>
            <Button type="button" disabled={saving} onClick={() => void saveAndLeave()} className="bg-accent text-bg hover:bg-accent-hover">{saving ? <Spinner /> : null} Guardar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}

// Registra la guardia de una vista mientras está montada.
export function useUnsavedGuard(guard: UnsavedGuard) {
  const { setGuard } = useUnsavedChanges();
  const latest = useRef(guard);
  useEffect(() => { latest.current = guard; });
  useEffect(() => {
    setGuard({ isDirty: () => latest.current.isDirty(), save: () => latest.current.save() });
    return () => setGuard(null);
  }, [setGuard]);
}

// Enlace interno que pasa por la guardia antes de navegar.
export function GuardedLink({ onClick, ...props }: React.ComponentProps<typeof Link>) {
  const { confirmLeave } = useUnsavedChanges();
  const router = useRouter();
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        confirmLeave(() => router.push(String(props.href)));
      }}
    />
  );
}
