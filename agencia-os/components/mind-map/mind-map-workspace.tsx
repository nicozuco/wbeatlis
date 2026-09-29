"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Waypoints } from "lucide-react";
import { toast } from "sonner";

import { createMindMap } from "@/app/actions";
import { fieldClass, selectContentClass } from "@/components/shared/field-styles";
import { PageHeader } from "@/components/shared/page-header";
import { useUnsavedChanges } from "@/components/shared/unsaved-changes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { sortNodesParentFirst, toFlowEdge, toFlowNode, type RawMindMapEdge, type RawMindMapNode } from "./graph-utils";
import { MindMapCanvas } from "./mind-map-canvas";
import type { MindMapRecords } from "./types";

export type MindMapSummary = { id: string; name: string; updatedAt: string };

export function MindMapWorkspace({
  maps,
  activeMap,
  nodes,
  edges,
  records,
}: {
  maps: MindMapSummary[];
  activeMap: MindMapSummary | null;
  nodes: RawMindMapNode[];
  edges: RawMindMapEdge[];
  records: MindMapRecords;
}) {
  const router = useRouter();
  const { confirmLeave } = useUnsavedChanges();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const initialNodes = sortNodesParentFirst(nodes.map(toFlowNode));
  const initialEdges = edges.map(toFlowEdge);

  return (
    <>
      <PageHeader
        description="Estrategia · Lienzo infinito"
        title="Mapa mental"
        actions={
          <>
            {activeMap ? (
              <Select value={activeMap.id} onValueChange={(value) => confirmLeave(() => router.push(`/mapa?id=${value}`))}>
                <SelectTrigger className={`${fieldClass} w-56`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {maps.map((map) => (
                    <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button onClick={() => confirmLeave(() => setCreateOpen(true))} className="h-10 bg-accent text-bg hover:bg-accent-hover">
              <Plus className="size-4" /> Nuevo mapa
            </Button>
          </>
        }
      />

      <section className="mt-6">
        {activeMap ? (
          <MindMapCanvas
            key={activeMap.updatedAt}
            mapId={activeMap.id}
            mapName={activeMap.name}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            initialRecords={records}
            initialMapUpdatedAt={activeMap.updatedAt}
          />
        ) : (
          <div className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-surface text-center">
            <Waypoints className="size-10 text-text-faint" strokeWidth={1.5} />
            <div>
              <p className="font-heading text-lg font-medium text-text">Todavía no tienes ningún mapa</p>
              <p className="mt-1 text-sm text-text-muted">Crea el primero para empezar a organizar ideas conectadas con tus datos.</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="bg-accent text-bg hover:bg-accent-hover">
              <Plus className="size-4" /> Crear tu primer mapa
            </Button>
          </div>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-border bg-surface-raised text-text sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl"><Waypoints className="size-5 text-accent" /> Nuevo mapa mental</DialogTitle>
            <DialogDescription className="text-text-muted">Por ejemplo: «Estrategia de captación» o «Ideas de contenido».</DialogDescription>
          </DialogHeader>
          <div>
            <Label className="mb-2 text-text-muted">Nombre del mapa</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del mapa…" className={fieldClass} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border-border bg-surface text-text">Cancelar</Button>
            <Button
              type="button"
              disabled={pending || !name.trim()}
              onClick={() => startTransition(async () => {
                try {
                  const id = await createMindMap(name);
                  setCreateOpen(false);
                  setName("");
                  router.push(`/mapa?id=${id}`);
                } catch {
                  toast.error("No se pudo crear el mapa");
                }
              })}
              className="bg-accent text-bg hover:bg-accent-hover"
            >
              {pending ? "Creando…" : "Crear mapa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
