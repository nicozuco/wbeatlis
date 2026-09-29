"use client";

import { useState } from "react";
import { NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import { Heading, Plus, type LucideIcon } from "lucide-react";

import { TABLE_MAX_COLS, TABLE_MAX_ROWS } from "@/lib/mind-map-style";
import { DEFAULT_NODE_SIZE } from "../graph-utils";
import { useMindMap } from "../mind-map-context";
import { ToolbarTooltip } from "../toolbar";
import type { TableFlowNode } from "../types";
import { BaseNode } from "./base-node";

type Cell = { row: number; col: number };

function ToolbarAction({ label, onClick, disabled = false, active = false, icon: Icon, children }: { label: string; onClick: () => void; disabled?: boolean; active?: boolean; icon?: LucideIcon; children?: React.ReactNode }) {
  return (
    <ToolbarTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
        className={`flex h-8 items-center gap-1 rounded-lg px-2 text-xs disabled:opacity-40 ${active ? "bg-accent-soft text-accent" : "text-text-muted hover:bg-surface-raised hover:text-text"}`}
      >
        {Icon ? <Icon className="size-4" /> : null}
        {children}
      </button>
    </ToolbarTooltip>
  );
}

// Tabla como en FigJam. Doble clic en una celda para escribir: Tab pasa a la
// siguiente, Intro a la de abajo, Mayús+Intro hace un salto de línea y Escape
// cancela. Con la tabla seleccionada, los botones + de los bordes (más allá de
// los conectores, para no taparlos) añaden una
// columna o una fila, y la barra de arriba permite quitarlas o marcar la
// primera fila como cabecera. Filas y columnas reparten el tamaño del nodo, así
// que al redimensionarla todas las celdas crecen a la vez.
export function TableNode({ id, data, selected, dragging, width, height }: NodeProps<TableFlowNode>) {
  const { updateTable } = useMindMap();
  const [editing, setEditing] = useState<Cell | null>(null);
  const [draft, setDraft] = useState("");

  const cells = data.media.cells;
  const header = Boolean(data.media.header);
  const rows = cells.length;
  const cols = cells[0]?.length ?? 1;
  const w = width ?? DEFAULT_NODE_SIZE.TABLE.width;
  const h = height ?? DEFAULT_NODE_SIZE.TABLE.height;
  const cellWidth = w / cols;
  const cellHeight = h / rows;

  const startEditing = (cell: Cell) => {
    setEditing(cell);
    setDraft(cells[cell.row]?.[cell.col] ?? "");
  };

  // Guarda la celda en edición y, si se indica, pasa a editar `next`.
  const commit = (next?: Cell) => {
    if (!editing) return;
    let nextCells = cells;
    if (draft !== cells[editing.row]?.[editing.col]) {
      nextCells = cells.map((row) => [...row]);
      nextCells[editing.row][editing.col] = draft;
      updateTable(id, { ...data.media, cells: nextCells });
    }
    if (next) {
      setEditing(next);
      setDraft(nextCells[next.row]?.[next.col] ?? "");
    } else {
      setEditing(null);
    }
  };

  const setShape = (nextCells: string[][], size: { width: number; height: number }) => {
    setEditing(null);
    updateTable(id, { ...data.media, cells: nextCells }, size);
  };

  const addRow = () => setShape([...cells, Array.from({ length: cols }, () => "")], { width: w, height: h + cellHeight });
  const removeRow = () => setShape(cells.slice(0, -1), { width: w, height: h - cellHeight });
  const addCol = () => setShape(cells.map((row) => [...row, ""]), { width: w + cellWidth, height: h });
  const removeCol = () => setShape(cells.map((row) => row.slice(0, -1)), { width: w - cellWidth, height: h });

  const showControls = selected && !dragging;

  return (
    <BaseNode id={id} selected={selected} minWidth={cols * 40} minHeight={rows * 24}>
      <NodeToolbar isVisible={showControls && !editing} position={Position.Top} offset={16} className="nodrag nopan">
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1 shadow-lg">
          <span className="px-2 font-mono text-xs text-text-faint tabular-nums">{cols} × {rows}</span>
          <div className="mx-1 h-5 w-px bg-border" />
          <ToolbarAction label="Añadir fila" onClick={addRow} disabled={rows >= TABLE_MAX_ROWS}>+ Fila</ToolbarAction>
          <ToolbarAction label="Quitar la última fila" onClick={removeRow} disabled={rows <= 1}>− Fila</ToolbarAction>
          <div className="mx-1 h-5 w-px bg-border" />
          <ToolbarAction label="Añadir columna" onClick={addCol} disabled={cols >= TABLE_MAX_COLS}>+ Columna</ToolbarAction>
          <ToolbarAction label="Quitar la última columna" onClick={removeCol} disabled={cols <= 1}>− Columna</ToolbarAction>
          <div className="mx-1 h-5 w-px bg-border" />
          <ToolbarAction label="Primera fila como cabecera" icon={Heading} active={header} onClick={() => updateTable(id, { ...data.media, header: !header })} />
        </div>
      </NodeToolbar>

      <div
        className="mindmap-table grid size-full overflow-hidden rounded-md border"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {cells.flatMap((row, r) =>
          row.map((text, c) => {
            const isEditing = editing?.row === r && editing.col === c;
            return (
              <div
                key={`${r}-${c}`}
                onDoubleClick={(event) => { event.stopPropagation(); startEditing({ row: r, col: c }); }}
                className={`mindmap-table-cell relative min-h-0 min-w-0 overflow-hidden px-2 py-1.5 text-[13px] leading-snug ${c < cols - 1 ? "border-r" : ""} ${r < rows - 1 ? "border-b" : ""} ${header && r === 0 ? "mindmap-table-header font-medium" : ""}`}
              >
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    onBlur={() => commit()}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        setEditing(null);
                      } else if (event.key === "Tab") {
                        event.preventDefault();
                        const index = r * cols + c + (event.shiftKey ? -1 : 1);
                        commit(index >= 0 && index < rows * cols ? { row: Math.floor(index / cols), col: index % cols } : undefined);
                      } else if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        commit(r + 1 < rows ? { row: r + 1, col: c } : undefined);
                      }
                    }}
                    className="nodrag nopan nowheel absolute inset-0 size-full resize-none bg-surface px-2 py-1.5 text-[13px] leading-snug text-text outline-2 -outline-offset-2 outline-accent"
                  />
                ) : (
                  <span className="block break-words whitespace-pre-wrap">{text}</span>
                )}
              </div>
            );
          }),
        )}
      </div>

      {showControls ? (
        <>
          <ToolbarTooltip label="Añadir columna">
            <button
              type="button"
              aria-label="Añadir columna"
              disabled={cols >= TABLE_MAX_COLS}
              onClick={addCol}
              className="nodrag nopan absolute top-1/2 -right-11 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-accent text-bg shadow disabled:opacity-40"
            >
              <Plus className="size-3" strokeWidth={2.5} />
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Añadir fila">
            <button
              type="button"
              aria-label="Añadir fila"
              disabled={rows >= TABLE_MAX_ROWS}
              onClick={addRow}
              className="nodrag nopan absolute -bottom-11 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-accent text-bg shadow disabled:opacity-40"
            >
              <Plus className="size-3" strokeWidth={2.5} />
            </button>
          </ToolbarTooltip>
        </>
      ) : null}
    </BaseNode>
  );
}
