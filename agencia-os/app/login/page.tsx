import { redirect } from "next/navigation";

import { LoginAside, LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedUser } from "@/lib/auth";
import { BrandLogo } from "@/components/shared/brand-mark";

export const dynamic = "force-dynamic";

function safeNextPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getAuthenticatedUser();
  if (user) redirect("/");
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_520px]">
        <LoginAside />
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-10 lg:hidden">
              <BrandLogo className="w-36" />
            </div>
            <div className="mb-8">
              <p className="section-label">Acceso privado</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em] text-text">Bienvenido de nuevo</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">Introduce las credenciales creadas por el administrador de la agencia.</p>
            </div>
            <LoginForm nextPath={nextPath} />
            <p className="mt-8 text-center text-xs leading-5 text-text-faint">¿Necesitas acceso? Solicita al administrador que cree tu usuario en Supabase.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
