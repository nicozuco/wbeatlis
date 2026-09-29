"use client";

import { useState, useTransition } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { saveNavigationPreferences } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { navigationItems, orderedNavigation, type NavItem, type NavPreferences } from "@/lib/navigation";

function SortableRow({ item, index, total, hidden, onToggle, onMove }: { item: NavItem; index: number; total: number; hidden: boolean; onToggle: () => void; onMove: (direction: -1 | 1) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.href });
  const Icon = item.icon;
  const iconButton = "grid size-8 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${isDragging ? "z-10 border-accent/50 bg-surface-raised" : "border-border bg-surface-raised"} ${hidden ? "opacity-60" : ""}`}
    >
      <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Arrastrar ${item.label}`} className="grid size-8 cursor-grab place-items-center rounded-md text-text-faint hover:text-text active:cursor-grabbing">
        <GripVertical className="size-4" />
      </button>
      <span className={`grid size-8 place-items-center rounded-md ${hidden ? "text-text-faint" : "bg-accent-soft text-accent"}`}><Icon className="size-4" strokeWidth={1.8} /></span>
      <span className={`min-w-0 flex-1 truncate text-sm ${hidden ? "text-text-muted line-through" : "text-text"}`}>{item.label}</span>
      <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Subir ${item.label}`} className={iconButton}><ArrowUp className="size-4" /></button>
      <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Bajar ${item.label}`} className={iconButton}><ArrowDown className="size-4" /></button>
      <button type="button" onClick={onToggle} aria-pressed={!hidden} aria-label={hidden ? `Mostrar ${item.label}` : `Ocultar ${item.label}`} className={`${iconButton} ${hidden ? "" : "text-accent"}`}>
        {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </li>
  );
}

// Ordenar (arrastrando o con las flechas) y ocultar apartados del menú lateral.
// Se guarda por usuario, así que se mantiene en todos sus dispositivos.
export function NavigationSettings({ initial }: { initial: NavPreferences }) {
  const [order, setOrder] = useState(() => orderedNavigation(initial).map((item) => item.href));
  const [hidden, setHidden] = useState<string[]>(initial.hidden);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const byHref = new Map(navigationItems.map((item) => [item.href, item]));
  const items = order.map((href) => byHref.get(href)!).filter(Boolean);
  const savedOrder = orderedNavigation(initial).map((item) => item.href);
  const dirty = order.join() !== savedOrder.join() || [...hidden].sort().join() !== [...initial.hidden].sort().join();
  const visibleCount = items.length - hidden.length;

  const move = (href: string, direction: -1 | 1) => setOrder((current) => {
    const index = current.indexOf(href);
    const target = index + direction;
    return target < 0 || target >= current.length ? current : arrayMove(current, index, target);
  });

  const toggle = (href: string) => setHidden((current) => {
    if (current.includes(href)) return current.filter((value) => value !== href);
    if (items.length - current.length <= 1) { toast.error("Deja al menos un apartado visible en el menú."); return current; }
    return [...current, href];
  });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setOrder((current) => arrayMove(current, current.indexOf(String(active.id)), current.indexOf(String(over.id))));
  };

  const save = (next: NavPreferences, message: string) => startTransition(async () => {
    try {
      await saveNavigationPreferences(next);
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el menú");
    }
  });

  const reset = () => {
    setOrder(navigationItems.map((item) => item.href));
    setHidden([]);
    save({ order: [], hidden: [] }, "Menú restablecido");
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <SortableRow key={item.href} item={item} index={index} total={items.length} hidden={hidden.includes(item.href)} onToggle={() => toggle(item.href)} onMove={(direction) => move(item.href, direction)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-text-faint">{visibleCount} de {items.length} apartados visibles. Los ocultos siguen accesibles por su dirección.</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={reset} className="text-text-muted hover:text-text"><RotateCcw className="size-4" /> Restablecer</Button>
          <Button type="button" disabled={pending || !dirty} onClick={() => save({ order, hidden }, "Menú actualizado")} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Guardando…" : "Guardar menú"}</Button>
        </div>
      </div>
    </div>
  );
}
