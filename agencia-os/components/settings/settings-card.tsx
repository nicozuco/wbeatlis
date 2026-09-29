// Piezas comunes de Ajustes: tarjeta con título y fila "etiqueta · control".

export function SettingsCard({ title, description, children, footer, danger = false }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border bg-surface ${danger ? "border-danger/30" : "border-border"}`}>
      <header className="border-b border-border px-5 py-4">
        <h3 className={`font-heading text-base font-semibold ${danger ? "text-danger" : "text-text"}`}>{title}</h3>
        {description ? <p className="mt-1 text-sm leading-5 text-text-muted">{description}</p> : null}
      </header>
      <div className="px-5 py-4">{children}</div>
      {footer ? <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-bg/40 px-5 py-3">{footer}</footer> : null}
    </section>
  );
}

export function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{label}</p>
        {description ? <p className="mt-0.5 text-xs leading-5 text-text-muted">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
