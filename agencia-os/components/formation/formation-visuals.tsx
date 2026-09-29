// Bloques visuales que la guía escribe en Markdown como bloques de código:
// ```flujo, ```formula, ```grafico y ```embudo. El texto sigue siendo legible en
// Obsidian y buscable; la app lo dibuja.

export const VISUAL_LANGUAGES = new Set(["flujo", "formula", "grafico", "embudo"]);

// Colores categóricos validados (daltonismo y contraste) en tema claro y oscuro.
const SERIES_COLORS = ["#1A9E8F", "#D95926", "#9085E9"];

function lines(source: string) {
  return source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function parseNumber(raw: string) {
  const clean = raw.replace(/[^\d,.-]/g, "");
  if (!/\d/.test(clean)) return null;
  const normalized = /,\d{1,2}$/.test(clean) ? clean.replace(/\./g, "").replace(",", ".") : clean.replace(/[.,](?=\d{3}\b)/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function formatNumber(value: number, unit: string) {
  const text = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: "always" }).format(value);
  if (!unit) return text;
  return unit === "%" ? `${text} %` : `${text} ${unit}`;
}

type ChartData = { title: string | null; unit: string; series: string[]; rows: { label: string; values: (number | null)[] }[]; note: string | null };

export function parseChart(source: string): ChartData {
  const data: ChartData = { title: null, unit: "", series: [], rows: [], note: null };
  for (const line of lines(source)) {
    const meta = line.match(/^(titulo|título|unidad|series|nota):\s*(.*)$/i);
    if (meta) {
      const key = meta[1].toLowerCase();
      if (key.startsWith("t")) data.title = meta[2];
      else if (key === "unidad") data.unit = meta[2];
      else if (key === "series") data.series = meta[2].split("|").map((item) => item.trim());
      else data.note = meta[2];
      continue;
    }
    const separator = line.lastIndexOf(":");
    if (separator <= 0) continue;
    data.rows.push({ label: line.slice(0, separator).trim(), values: line.slice(separator + 1).split("|").map((value) => parseNumber(value)) });
  }
  const width = Math.max(1, ...data.rows.map((row) => row.values.length));
  if (data.series.length < width) data.series = Array.from({ length: width }, (_, index) => data.series[index] ?? `Serie ${index + 1}`);
  return data;
}

function Figure({ title, note, children, data }: { title: string | null; note?: string | null; children: React.ReactNode; data?: { head: string[]; rows: string[][] } }) {
  return (
    <figure className="formation-visual my-6 rounded-xl border border-border bg-bg/40 p-4 sm:p-5">
      {title ? <figcaption className="mb-4 font-heading text-sm font-semibold text-text">{title}</figcaption> : null}
      {children}
      {note ? <p className="mt-3 text-xs text-text-muted">{note}</p> : null}
      {data ? (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-text-muted hover:text-text">Ver datos en tabla</summary>
          <div className="mt-2 overflow-x-auto">
            <table>
              <thead><tr>{data.head.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
              <tbody>{data.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </details>
      ) : null}
    </figure>
  );
}

function BarChart({ source }: { source: string }) {
  const chart = parseChart(source);
  const max = Math.max(0, ...chart.rows.flatMap((row) => row.values.map((value) => value ?? 0)));
  const multi = chart.series.length > 1;
  return (
    <Figure
      title={chart.title}
      note={chart.note}
      data={{ head: ["", ...chart.series], rows: chart.rows.map((row) => [row.label, ...chart.series.map((_, index) => (row.values[index] === null || row.values[index] === undefined ? "—" : formatNumber(row.values[index]!, chart.unit)))]) }}
    >
      {multi ? (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted" aria-label="Leyenda">
          {chart.series.map((name, index) => (
            <li key={name} className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-sm" style={{ background: SERIES_COLORS[index % SERIES_COLORS.length] }} />{name}</li>
          ))}
        </ul>
      ) : null}
      <div className="space-y-3" role="img" aria-label={chart.title ?? "Gráfico de barras"}>
        {chart.rows.map((row) => (
          <div key={row.label} className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-center sm:gap-3">
            <span className="text-xs leading-tight text-text-muted">{row.label}</span>
            <div className="space-y-0.5">
              {chart.series.map((name, index) => {
                const value = row.values[index];
                if (value === null || value === undefined) return null;
                const width = max > 0 ? Math.max(1.5, (value / max) * 100) : 0;
                return (
                  <div key={name} className="flex items-center gap-2" title={`${row.label}${multi ? ` · ${name}` : ""}: ${formatNumber(value, chart.unit)}`}>
                    <div className="min-w-0 flex-1">
                      <div className="h-3.5 rounded-r-[4px] transition-opacity hover:opacity-80" style={{ width: `${width}%`, minWidth: "4px", background: SERIES_COLORS[index % SERIES_COLORS.length] }} />
                    </div>
                    <span className="w-[4.75rem] shrink-0 text-right font-mono text-xs tabular-nums text-text">{formatNumber(value, chart.unit)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

function Funnel({ source }: { source: string }) {
  const chart = parseChart(source);
  const steps = chart.rows.filter((row) => row.values[0] !== null) as { label: string; values: number[] }[];
  const max = Math.max(1, ...steps.map((step) => step.values[0]));
  return (
    <Figure
      title={chart.title}
      note={chart.note}
      data={{ head: ["Etapa", "Cantidad", "Paso anterior"], rows: steps.map((step, index) => [step.label, formatNumber(step.values[0], chart.unit), index ? `${Math.round((step.values[0] / steps[index - 1].values[0]) * 100)} %` : "—"]) }}
    >
      <ol className="space-y-1" aria-label={chart.title ?? "Embudo"}>
        {steps.map((step, index) => {
          const width = Math.max(40, (step.values[0] / max) * 100);
          const rate = index ? Math.round((step.values[0] / steps[index - 1].values[0]) * 100) : null;
          return (
            <li key={step.label}>
              {rate !== null ? <p className="py-0.5 text-center text-[11px] text-text-faint">↓ {rate} % pasa a la siguiente etapa</p> : null}
              <div className="mx-auto flex min-h-10 items-center justify-between gap-3 rounded-md px-3 py-1.5" style={{ width: `${width}%`, background: `color-mix(in srgb, ${SERIES_COLORS[0]} ${Math.round(38 - (index / Math.max(1, steps.length - 1)) * 22)}%, transparent)` }} title={`${step.label}: ${formatNumber(step.values[0], chart.unit)}`}>
                <span className="truncate text-xs text-text">{step.label}</span>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-text">{formatNumber(step.values[0], chart.unit)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </Figure>
  );
}

function Flow({ source }: { source: string }) {
  const all = lines(source);
  const titleLine = all[0]?.match(/^(?:titulo|título):\s*(.*)$/i);
  const steps = (titleLine ? all.slice(1) : all).map((line) => {
    const [name, ...rest] = line.split("|");
    return { name: name.trim(), detail: rest.join("|").trim() };
  });
  return (
    <Figure title={titleLine?.[1] ?? null}>
      <ol className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]">
        {steps.map((step, index) => (
          <li key={`${step.name}-${index}`} className="relative flex gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-col sm:gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">{index + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-text">{step.name}</p>
              {step.detail ? <p className="mt-0.5 text-xs leading-snug text-text-muted">{step.detail}</p> : null}
            </div>
            {index < steps.length - 1 ? <span aria-hidden className="absolute -bottom-2 left-6 z-10 text-xs text-text-faint sm:hidden">↓</span> : null}
          </li>
        ))}
      </ol>
    </Figure>
  );
}

function Formula({ source }: { source: string }) {
  const [main, ...rest] = lines(source);
  return (
    <div className="formation-visual my-6 rounded-xl border border-accent/30 bg-accent-soft px-5 py-4">
      <p className="font-mono text-base font-semibold leading-relaxed text-text sm:text-lg">{main}</p>
      {rest.map((line, index) => <p key={index} className="mt-1 font-mono text-sm text-text-muted">{line}</p>)}
    </div>
  );
}

export function FormationVisual({ language, source }: { language: string; source: string }) {
  if (language === "grafico") return <BarChart source={source} />;
  if (language === "embudo") return <Funnel source={source} />;
  if (language === "flujo") return <Flow source={source} />;
  return <Formula source={source} />;
}

const CALLOUTS: { pattern: RegExp; tone: string }[] = [
  { pattern: /^(clave|importante|regla)\b/i, tone: "border-accent/40 bg-accent-soft" },
  { pattern: /^(ojo|cuidado|error|evita)\b/i, tone: "border-warning/40 bg-warning/10" },
  { pattern: /^(ejemplo|caso)\b/i, tone: "border-info/40 bg-info/10" },
];

// Una cita que empieza por **Clave:**, **Ojo:** o **Ejemplo:** se muestra como aviso destacado.
export function calloutTone(text: string) {
  return CALLOUTS.find((callout) => callout.pattern.test(text.trim()))?.tone ?? null;
}
