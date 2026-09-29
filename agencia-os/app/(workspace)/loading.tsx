// Se muestra al instante al cambiar de apartado mientras el servidor consulta la base.
export default function WorkspaceLoading() {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse space-y-6 motion-reduce:animate-none">
      <div className="space-y-3">
        <div className="h-9 w-56 rounded-lg bg-surface-raised" />
        <div className="h-3 w-80 max-w-full rounded bg-surface-raised" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-xl border border-border bg-surface" />)}
      </div>
      <div className="h-96 rounded-xl border border-border bg-surface" />
    </div>
  );
}
