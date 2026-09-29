import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  note,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "default" | "danger" | "success" | "warning";
  icon?: LucideIcon;
}) {
  const valueTone = {
    default: "text-text",
    danger: "text-danger",
    success: "text-success",
    warning: "text-warning",
  }[tone];

  return (
    <article className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between gap-3">
        <p className="section-label">{label}</p>
        {Icon ? <Icon className="size-4 text-text-faint" strokeWidth={1.8} /> : null}
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <p className={`font-mono text-[1.75rem] font-semibold leading-none tracking-[-0.04em] tabular-nums ${valueTone}`}>{value}</p>
        {note ? <span className="text-right text-xs text-text-muted">{note}</span> : null}
      </div>
    </article>
  );
}
