"use client";

import { useSyncExternalStore, useState, useTransition } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { login } from "@/app/auth/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REMEMBERED_EMAIL_KEY } from "@/lib/supabase/session";
import { BrandLogo } from "@/components/shared/brand-mark";

const subscribe = () => () => {};
const getRememberedEmail = () => (typeof window === "undefined" ? "" : window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "");
const getServerEmail = () => "";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const rememberedEmail = useSyncExternalStore(subscribe, getRememberedEmail, getServerEmail);
  const [email, setEmail] = useState<string | null>(null);
  const [remember, setRemember] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const currentEmail = email ?? rememberedEmail;
  const currentRemember = remember ?? Boolean(rememberedEmail);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    setError(null);

    startTransition(async () => {
      const result = await login({ email: currentEmail, password, remember: currentRemember });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (currentRemember) window.localStorage.setItem(REMEMBERED_EMAIL_KEY, currentEmail);
      else window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      router.replace(nextPath);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm text-text">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={currentEmail}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          autoComplete="username"
          autoFocus
          required
          className="h-11 border-border bg-bg text-text placeholder:text-text-faint focus-visible:border-accent focus-visible:ring-accent/30"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm text-text">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••"
            autoComplete="current-password"
            required
            className="h-11 border-border bg-bg pr-11 text-text placeholder:text-text-faint focus-visible:border-accent focus-visible:ring-accent/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint transition-colors hover:text-text"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="remember"
          checked={currentRemember}
          onCheckedChange={(checked) => setRemember(checked === true)}
          className="mt-0.5 border-border data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-bg"
        />
        <div className="space-y-1">
          <Label htmlFor="remember" className="cursor-pointer text-sm text-text">Recordarme en este dispositivo</Label>
          <p className="text-xs leading-5 text-text-muted">Mantiene la sesión y recuerda el email. La contraseña nunca se guarda en la aplicación.</p>
        </div>
      </div>

      {error ? <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {pending ? "Comprobando acceso…" : "Entrar en Atlis"}
      </button>
    </form>
  );
}

export function LoginAside() {
  return (
    <div className="hidden min-h-screen flex-col justify-between border-r border-border bg-surface p-10 lg:flex xl:p-14">
      <div>
        <BrandLogo className="w-40" />
        <div className="mt-28 max-w-md">
          <p className="section-label">Espacio de trabajo privado</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-text">Todo lo que necesita tu agencia, en un solo lugar.</h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-text-muted">Clientes, pipeline, tareas, contenido y finanzas preparados para empezar el día con claridad.</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-text-muted">
        <ShieldCheck className="size-4 text-accent" />
        <span>Acceso gestionado por Supabase Auth</span>
      </div>
    </div>
  );
}
