"use client";

import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export type KanbanColumn<C extends string> = { id: C; header: React.ReactNode };

const gridColumns: Record<number, string> = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

function KanbanCard({ id, label, className, children }: { id: string; label: string; className: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`relative rounded-xl border bg-surface p-3 transition-colors hover:border-border-strong ${className} ${isDragging ? "z-50 opacity-70" : ""}`}
    >
      <button type="button" aria-label={`Mover ${label}`} className="absolute right-2 top-2 cursor-grab touch-none rounded p-1 text-text-faint hover:text-text" {...listeners} {...attributes}>
        <GripVertical className="size-4" />
      </button>
      <div className="pr-6">{children}</div>
    </article>
  );
}

function KanbanColumnView({ id, header, count, fixedWidth, emptyLabel, children }: { id: string; header: React.ReactNode; count: number; fixedWidth: boolean; emptyLabel: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section ref={setNodeRef} className={`${fixedWidth ? "w-[280px] shrink-0" : "min-h-[300px]"} rounded-xl border bg-bg/60 p-3 transition-colors ${isOver ? "border-accent bg-accent-soft" : "border-border"}`}>
      <header className="mb-3 flex items-center justify-between gap-2">
        {header}
        <span className="font-mono text-xs tabular-nums text-text-muted">{count}</span>
      </header>
      <div className="space-y-2">
        {children}
        {count === 0 ? <div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-border text-xs text-text-faint">{emptyLabel}</div> : null}
      </div>
    </section>
  );
}

// Tablero por columnas con arrastrar y soltar. "scroll" para muchas columnas de
// ancho fijo (fases del pipeline), "grid" para pocas que reparten el ancho.
export function KanbanBoard<T, C extends string>({
  columns,
  items,
  getItemId,
  getItemColumn,
  getItemLabel,
  renderCard,
  onMove,
  emptyLabel,
  busy = false,
  layout = "grid",
  getCardClassName,
}: {
  columns: KanbanColumn<C>[];
  items: T[];
  getItemId: (item: T) => string;
  getItemColumn: (item: T) => C;
  getItemLabel: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  onMove: (item: T, column: C) => void;
  emptyLabel: string;
  busy?: boolean;
  layout?: "scroll" | "grid";
  getCardClassName?: (item: T) => string;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const column = columns.find((candidate) => candidate.id === over.id);
    const item = items.find((candidate) => getItemId(candidate) === active.id);
    if (!column || !item || getItemColumn(item) === column.id) return;
    onMove(item, column.id);
  };

  const containerClass = layout === "scroll" ? "scrollbar-thin flex gap-3 overflow-x-auto" : `grid gap-3 ${gridColumns[columns.length] ?? ""}`;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={`${containerClass} p-4 ${busy ? "pointer-events-none opacity-70" : ""}`}>
        {columns.map((column) => {
          const columnItems = items.filter((item) => getItemColumn(item) === column.id);
          return (
            <KanbanColumnView key={column.id} id={column.id} header={column.header} count={columnItems.length} fixedWidth={layout === "scroll"} emptyLabel={emptyLabel}>
              {columnItems.map((item) => (
                <KanbanCard key={getItemId(item)} id={getItemId(item)} label={getItemLabel(item)} className={getCardClassName?.(item) ?? "border-border"}>
                  {renderCard(item)}
                </KanbanCard>
              ))}
            </KanbanColumnView>
          );
        })}
      </div>
    </DndContext>
  );
}
