"use client";

import { useEffect, useState } from "react";

import { searchClinicsForMap, searchCompetitorsForMap } from "@/app/actions";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhaseChip, ThreatChip } from "@/components/shared/status-chip";

export type ClinicResult = Awaited<ReturnType<typeof searchClinicsForMap>>[number];
export type CompetitorResult = Awaited<ReturnType<typeof searchCompetitorsForMap>>[number];

export function RecordPicker({
  kind,
  open,
  onOpenChange,
  onPick,
}: {
  kind: "CLIENT" | "COMPETITOR";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (result: ClinicResult | CompetitorResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(ClinicResult | CompetitorResult)[]>([]);
  // Query a la que corresponden `results`. Mientras no coincida con `query`
  // hay una búsqueda pendiente — evita un estado `loading` aparte que
  // tendría que fijarse de forma síncrona dentro del efecto.
  const [resultsQuery, setResultsQuery] = useState<string | null>(null);
  const loading = resultsQuery !== query;

  // Reinicia la búsqueda al abrir/cerrar el diálogo. Ajuste de estado
  // durante el render (no en un efecto) porque solo reacciona a un cambio
  // puntual de `open`, no a un flujo continuo — ver
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setQuery("");
    setResults([]);
    setResultsQuery(null);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      const request: Promise<(ClinicResult | CompetitorResult)[]> = kind === "CLIENT" ? searchClinicsForMap(query) : searchCompetitorsForMap(query);
      void request.then((rows) => {
        if (!cancelled) { setResults(rows); setResultsQuery(query); }
      });
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, query, kind]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border bg-surface-raised p-0 text-text sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{kind === "CLIENT" ? "Buscar cliente" : "Buscar competidor"}</DialogTitle>
          <DialogDescription>Vincula un registro que ya existe en la app.</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput value={query} onValueChange={setQuery} placeholder={kind === "CLIENT" ? "Buscar clínica por nombre…" : "Buscar competidor por empresa…"} />
          <CommandList>
            <CommandEmpty>{loading ? "Buscando…" : "Sin resultados."}</CommandEmpty>
            <CommandGroup>
              {results.map((row) =>
                "name" in row ? (
                  <CommandItem key={row.id} value={row.id} onSelect={() => onPick(row)} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.name}</span>
                    <PhaseChip phase={row.phase} />
                  </CommandItem>
                ) : (
                  <CommandItem key={row.id} value={row.id} onSelect={() => onPick(row)} className="flex items-center justify-between gap-3">
                    <span className="truncate">{row.company}</span>
                    <ThreatChip level={row.threatLevel} />
                  </CommandItem>
                )
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
