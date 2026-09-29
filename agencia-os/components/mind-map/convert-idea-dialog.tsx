"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { convertIdeaToContent } from "@/app/actions";
import { selectContentClass, fieldClass } from "@/components/shared/field-styles";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ContentFormat = "IMAGE" | "CAROUSEL" | "REEL";
const formatLabel: Record<ContentFormat, string> = { IMAGE: "Imagen", CAROUSEL: "Carrusel", REEL: "Reel" };

export type ConvertedContent = { id: string; title: string; status: string; format: string };

// La pieza de Contenido se crea al momento; el nodo pasa a referenciarla en el
// lienzo y queda guardado con el resto del mapa al pulsar Guardar.
export function ConvertIdeaDialog({
  target,
  onOpenChange,
  onConverted,
}: {
  target: { nodeId: string; text: string } | null;
  onOpenChange: (open: boolean) => void;
  onConverted: (nodeId: string, content: ConvertedContent) => void;
}) {
  const [format, setFormat] = useState<ContentFormat>("IMAGE");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface-raised text-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Convertir en contenido</DialogTitle>
          <DialogDescription className="text-text-muted">
            «{target?.text || "Idea sin título"}» pasará a la sección de Contenido, conservando el texto como título.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label className="mb-2 block text-sm text-text-muted">Formato</label>
          <Select value={format} onValueChange={(value) => setFormat(value as ContentFormat)}>
            <SelectTrigger className={`${fieldClass} w-full`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              {(Object.entries(formatLabel) as [ContentFormat, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border bg-surface text-text">Cancelar</Button>
          <Button
            type="button"
            disabled={pending || !target}
            onClick={() => {
              if (!target) return;
              startTransition(async () => {
                try {
                  const content = await convertIdeaToContent({ title: target.text, format });
                  onConverted(target.nodeId, content);
                  toast.success("Pieza creada en Contenido");
                  onOpenChange(false);
                } catch {
                  toast.error("No se pudo convertir la idea");
                }
              });
            }}
            className="bg-accent text-bg hover:bg-accent-hover"
          >
            {pending ? "Convirtiendo…" : "Convertir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
