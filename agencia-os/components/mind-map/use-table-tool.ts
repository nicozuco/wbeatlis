"use client";

import { useCallback, useState } from "react";
import { useReactFlow } from "@xyflow/react";

import { TABLE_CELL_HEIGHT, TABLE_CELL_WIDTH, TABLE_MAX_COLS, TABLE_MAX_ROWS } from "@/lib/mind-map-style";

export type TableBox = { x: number; y: number; rows: number; cols: number };
// Vista previa en píxeles del contenedor del lienzo, más el tamaño de celda con el zoom actual.
export type TableDraft = { left: number; top: number; width: number; height: number; cellWidth: number; cellHeight: number; rows: number; cols: number };

const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;
const clamp = (value: number, max: number) => Math.min(max, Math.max(1, value));

// Herramienta Tabla, como en FigJam: hacer clic y arrastrar sobre el lienzo
// vacío muestra una rejilla que crece una celda por cada TABLE_CELL_WIDTH ×
// TABLE_CELL_HEIGHT arrastrados; al soltar se crea la tabla con esas filas y
// columnas. Un clic sin arrastrar crea una tabla de 3 × 3.
export function useTableTool({ active, onCreate }: { active: boolean; onCreate: (box: TableBox) => void }) {
  const reactFlow = useReactFlow();
  const [draft, setDraft] = useState<TableDraft | null>(null);

  const onPointerDownCapture = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!active || event.button !== 0) return;
    if (!(event.target as Element).closest(".react-flow__pane")) return;
    event.preventDefault();
    event.stopPropagation();

    const bounds = event.currentTarget.getBoundingClientRect();
    const start = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const startClient = { x: event.clientX, y: event.clientY };
    let moved = false;

    const boxAt = (clientX: number, clientY: number): TableBox => {
      const current = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });
      const dx = current.x - start.x;
      const dy = current.y - start.y;
      const cols = clamp(Math.ceil(Math.abs(dx) / TABLE_CELL_WIDTH), TABLE_MAX_COLS);
      const rows = clamp(Math.ceil(Math.abs(dy) / TABLE_CELL_HEIGHT), TABLE_MAX_ROWS);
      return { x: dx < 0 ? start.x - cols * TABLE_CELL_WIDTH : start.x, y: dy < 0 ? start.y - rows * TABLE_CELL_HEIGHT : start.y, rows, cols };
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!moved && Math.hypot(moveEvent.clientX - startClient.x, moveEvent.clientY - startClient.y) < 5) return;
      moved = true;
      const box = boxAt(moveEvent.clientX, moveEvent.clientY);
      const zoom = reactFlow.getZoom();
      const corner = reactFlow.flowToScreenPosition({ x: box.x, y: box.y });
      setDraft({
        left: corner.x - bounds.left,
        top: corner.y - bounds.top,
        width: box.cols * TABLE_CELL_WIDTH * zoom,
        height: box.rows * TABLE_CELL_HEIGHT * zoom,
        cellWidth: TABLE_CELL_WIDTH * zoom,
        cellHeight: TABLE_CELL_HEIGHT * zoom,
        rows: box.rows,
        cols: box.cols,
      });
    };

    const handleEnd = (endEvent: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      setDraft(null);
      if (endEvent.type === "pointercancel") return;
      onCreate(moved ? boxAt(endEvent.clientX, endEvent.clientY) : { x: start.x, y: start.y, rows: DEFAULT_ROWS, cols: DEFAULT_COLS });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
  }, [active, reactFlow, onCreate]);

  return { draft, onPointerDownCapture };
}
