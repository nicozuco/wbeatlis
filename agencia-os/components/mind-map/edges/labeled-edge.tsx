"use client";

import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, Position, getBezierPath, getSmoothStepPath, getStraightPath, useInternalNode, useStore, type EdgeProps, type InternalNode } from "@xyflow/react";
import { ArrowLeftRight, ChevronDown, CornerDownRight, Minus, Spline, Type, type LucideIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { edgeCapLabels, edgeCaps, edgePathLabels, edgePaths, edgeWidths, mindMapToneLabels, mindMapTones, type EdgeCap, type EdgePath } from "@/lib/mind-map-style";
import { useMindMap } from "../mind-map-context";
import { ToolbarTooltip } from "../toolbar";
import type { MindMapFlowEdge } from "../types";

const pathIcons: Record<EdgePath, LucideIcon> = { curved: Spline, elbow: CornerDownRight, straight: Minus };

// Ángulo (en grados) hacia el que apunta el extremo que toca un nodo por ese lado:
// una flecha que entra por la izquierda avanza hacia la derecha (0°).
const CAP_ANGLE: Record<Position, number> = { left: 0, right: 180, top: 90, bottom: -90 };

// Tamaño de cada extremo según el grosor de la línea y cuánto se acorta la
// línea para que no asome por la punta ni atraviese las figuras vacías.
function capGeometry(cap: EdgeCap, width: number) {
  switch (cap) {
    case "arrow": return { size: 8 + width * 2, inset: width / 2 };
    case "sketch": return { size: 10 + width * 2, inset: width / 2 };
    case "triangle": return { size: 7 + width * 2, inset: (7 + width * 2) * 0.85 };
    case "triangleOutline": return { size: 8 + width * 2, inset: 8 + width * 2 };
    case "diamond": return { size: 10 + width * 2, inset: 10 + width * 2 };
    case "dot": return { size: 2.5 + width, inset: 2.5 + width };
    case "circle": return { size: 3 + width, inset: (3 + width) * 2 };
    case "bar": return { size: 8 + width * 2, inset: 0 };
    default: return { size: 0, inset: 0 };
  }
}

// Extremo con la punta en (x, y) apuntando en `angle`. `color` es el color de la
// conexión (o currentColor en las miniaturas de los menús).
function Cap({ cap, x, y, angle, width, color }: { cap: EdgeCap; x: number; y: number; angle: number; width: number; color: string }) {
  if (cap === "none") return null;
  const { size: s } = capGeometry(cap, width);
  const transform = `translate(${x} ${y}) rotate(${angle})`;
  const line = { fill: "none", stroke: color, strokeWidth: Math.max(width, 1.5), strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const solid = { fill: color, stroke: color, strokeWidth: width, strokeLinejoin: "round" as const };
  switch (cap) {
    case "arrow":
      return <path transform={transform} d={`M${-s} ${-s * 0.55}L0 0L${-s} ${s * 0.55}`} {...line} />;
    case "sketch":
      // Dos trazos algo curvos y asimétricos, como una flecha hecha a mano.
      return <path transform={transform} d={`M${-s} ${-s * 0.62}Q${-s * 0.42} ${-s * 0.18} 0 0M${-s * 0.86} ${s * 0.7}Q${-s * 0.36} ${s * 0.28} 0 0`} {...line} />;
    case "triangle":
      return <path transform={transform} d={`M0 0L${-s} ${-s * 0.5}L${-s} ${s * 0.5}Z`} {...solid} />;
    case "triangleOutline":
      return <path transform={transform} d={`M0 0L${-s} ${-s * 0.5}L${-s} ${s * 0.5}Z`} {...line} />;
    case "diamond":
      return <path transform={transform} d={`M0 0L${-s / 2} ${-s * 0.36}L${-s} 0L${-s / 2} ${s * 0.36}Z`} {...solid} />;
    case "dot":
      return <circle transform={transform} cx={-s} cy={0} r={s} {...solid} />;
    case "circle":
      return <circle transform={transform} cx={-s} cy={0} r={s} {...line} />;
    case "bar":
      return <path transform={transform} d={`M0 ${-s / 2}V${s / 2}`} {...line} />;
  }
}

// Separación entre el borde de un nodo y el extremo de una conexión recta.
const FLOATING_GAP = 10;

// Punto del borde (ampliado con FLOATING_GAP) de `node` en la recta que va de su centro hacia `toward`.
function floatingPoint(node: InternalNode, toward: { x: number; y: number }) {
  const width = node.measured.width ?? node.width ?? 0;
  const height = node.measured.height ?? node.height ?? 0;
  const cx = node.internals.positionAbsolute.x + width / 2;
  const cy = node.internals.positionAbsolute.y + height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const scale = Math.max(Math.abs(dx) / (width / 2 + FLOATING_GAP), Math.abs(dy) / (height / 2 + FLOATING_GAP));
  return scale > 1 ? { x: cx + dx / scale, y: cy + dy / scale } : null;
}

function centerOf(node: InternalNode) {
  return { x: node.internals.positionAbsolute.x + (node.measured.width ?? node.width ?? 0) / 2, y: node.internals.positionAbsolute.y + (node.measured.height ?? node.height ?? 0) / 2 };
}

// Punto desplazado `distance` px hacia fuera del nodo por el lado `position`.
function pullBack(x: number, y: number, position: Position, distance: number) {
  if (position === Position.Left) return { x: x - distance, y };
  if (position === Position.Right) return { x: x + distance, y };
  if (position === Position.Top) return { x, y: y - distance };
  return { x, y: y + distance };
}

function ToolbarMenu({ label, trigger, children, contentClassName = "flex" }: { label: string; trigger: React.ReactNode; children: React.ReactNode; contentClassName?: string }) {
  const [open, setOpen] = useState(false);
  const { themeClass } = useMindMap();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ToolbarTooltip label={label}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={label} className={`flex h-8 items-center gap-1 rounded-lg px-2 text-text-muted hover:bg-surface-raised hover:text-text ${open ? "bg-surface-raised text-text" : ""}`}>
            {trigger}
            <ChevronDown className="size-3" />
          </button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent side="top" sideOffset={8} onOpenAutoFocus={(event) => event.preventDefault()} className={`${themeClass} ${contentClassName} w-auto gap-1 border-border bg-surface p-1.5 text-text`} onClick={() => setOpen(false)}>
        {children}
      </PopoverContent>
    </Popover>
  );
}

// Miniatura de un extremo para los menús: un trozo de línea con la punta a la derecha.
function CapIcon({ cap, flip = false }: { cap: EdgeCap; flip?: boolean }) {
  const inset = Math.min(capGeometry(cap, 1.5).inset, 12);
  return (
    <svg aria-hidden width={30} height={16} viewBox="0 0 30 16" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d={`M3 8H${26 - inset}`} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <Cap cap={cap} x={26} y={8} angle={0} width={1.5} color="currentColor" />
    </svg>
  );
}

function Option({ label, selected, onClick, children }: { label: string; selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <ToolbarTooltip label={label}>
      <button type="button" aria-label={label} aria-pressed={selected} onClick={onClick} className={`grid h-8 min-w-8 place-items-center rounded-lg px-1.5 hover:bg-surface-raised ${selected ? "bg-surface-raised text-text" : "text-text-muted"}`}>
        {children}
      </button>
    </ToolbarTooltip>
  );
}

// Conexión tipo FigJam: trazado curvo, en codo o recto; extremos (flecha,
// triángulo o punto) en cualquiera de los dos lados; color, grosor y
// discontinuo. Al seleccionarla aparece encima una barra con esas opciones y la
// etiqueta se edita con doble clic sobre la línea o desde la barra.
export function LabeledEdge({ id, source, target, sourceX: handleSourceX, sourceY: handleSourceY, targetX: handleTargetX, targetY: handleTargetY, sourcePosition, targetPosition, data, selected }: EdgeProps<MindMapFlowEdge>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const { updateEdgeLabel, updateEdgeOptions, swapEdgeDirection, labelEditRequest } = useMindMap();
  const zoom = useStore((state) => state.transform[2]);
  const onlySelectedEdge = useStore((state) => state.edges.filter((edge) => edge.selected).length === 1 && !state.nodes.some((node) => node.selected));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data?.label ?? "");
  const [handledNonce, setHandledNonce] = useState<number | null>(null);

  if (labelEditRequest && labelEditRequest.edgeId === id && labelEditRequest.nonce !== handledNonce) {
    setHandledNonce(labelEditRequest.nonce);
    setDraft(data?.label ?? "");
    setEditing(true);
  }

  const options = data?.options ?? { path: "straight", start: "none", end: "none", color: "neutral", width: 2, dashed: false };
  const width = options.width;
  const startInset = capGeometry(options.start, width).inset;
  const endInset = capGeometry(options.end, width).inset;

  // Una conexión recta no sale del conector sino del borde de cada nodo en la
  // dirección del otro (como en FigJam): así apunta de verdad al nodo siguiente
  // aunque estén desplazados. Si los nodos se solapan se usan los conectores.
  let sourceX = handleSourceX;
  let sourceY = handleSourceY;
  let targetX = handleTargetX;
  let targetY = handleTargetY;
  if (options.path === "straight" && sourceNode && targetNode) {
    const from = floatingPoint(sourceNode, centerOf(targetNode));
    const to = floatingPoint(targetNode, centerOf(sourceNode));
    if (from && to && Math.hypot(to.x - from.x, to.y - from.y) > 4) {
      ({ x: sourceX, y: sourceY } = from);
      ({ x: targetX, y: targetY } = to);
    }
  }

  let edgePath: string;
  let labelX: number;
  let labelY: number;
  let startAngle = CAP_ANGLE[sourcePosition];
  let endAngle = CAP_ANGLE[targetPosition];

  if (options.path === "straight") {
    const length = Math.hypot(targetX - sourceX, targetY - sourceY) || 1;
    const ux = (targetX - sourceX) / length;
    const uy = (targetY - sourceY) / length;
    [edgePath, labelX, labelY] = getStraightPath({ sourceX: sourceX + ux * startInset, sourceY: sourceY + uy * startInset, targetX: targetX - ux * endInset, targetY: targetY - uy * endInset });
    endAngle = (Math.atan2(uy, ux) * 180) / Math.PI;
    startAngle = endAngle + 180;
  } else {
    const source = pullBack(sourceX, sourceY, sourcePosition, startInset);
    const target = pullBack(targetX, targetY, targetPosition, endInset);
    const params = { sourceX: source.x, sourceY: source.y, sourcePosition, targetX: target.x, targetY: target.y, targetPosition };
    [edgePath, labelX, labelY] = options.path === "elbow" ? getSmoothStepPath({ ...params, borderRadius: 10, offset: 24 }) : getBezierPath(params);
  }

  const startEditing = () => { setDraft(data?.label ?? ""); setEditing(true); };

  const commit = () => {
    setEditing(false);
    if (draft !== (data?.label ?? "")) updateEdgeLabel(id, draft);
  };

  const toolbarVisible = selected && onlySelectedEdge && !editing;
  const PathIcon = pathIcons[options.path];

  return (
    <>
      {selected ? <path d={edgePath} fill="none" className="mindmap-edge-halo" strokeWidth={width + 6} strokeLinecap="round" /> : null}
      <g className={`mindmap-edge mindmap-tone-${options.color}`}>
        <BaseEdge id={id} path={edgePath} interactionWidth={24} style={{ stroke: "var(--edge-color)", strokeWidth: width, strokeDasharray: options.dashed ? `${width * 4} ${width * 3}` : undefined, strokeLinecap: "round" }} />
        <Cap cap={options.start} x={sourceX} y={sourceY} angle={startAngle} width={width} color="var(--edge-color)" />
        <Cap cap={options.end} x={targetX} y={targetY} angle={endAngle} width={width} color="var(--edge-color)" />
      </g>
      <EdgeLabelRenderer>
        <div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "all" }} className="nodrag nopan">
          {editing ? (
            <input
              autoFocus
              value={draft}
              placeholder="Etiqueta"
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") commit();
                if (event.key === "Escape") { event.stopPropagation(); setDraft(data?.label ?? ""); setEditing(false); }
              }}
              className="h-7 min-w-24 rounded-md border border-accent bg-surface-raised px-2 text-xs text-text outline-none"
            />
          ) : data?.label ? (
            <span onDoubleClick={(event) => { event.stopPropagation(); startEditing(); }} className={`block max-w-60 truncate rounded-md border bg-surface-raised px-2 py-0.5 text-xs text-text ${selected ? "border-accent" : "border-border"}`}>
              {data.label}
            </span>
          ) : null}

          {toolbarVisible ? (
            // La barra no escala con el zoom, como en Figma.
            <div style={{ position: "absolute", left: "50%", bottom: "100%", transform: `translate(-50%, -14px) scale(${1 / zoom})`, transformOrigin: "bottom center" }}>
              <div className="flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1 whitespace-nowrap shadow-lg">
                <ToolbarMenu label="Trazado" trigger={<PathIcon className="size-4" />}>
                  {edgePaths.map((path) => {
                    const Icon = pathIcons[path];
                    return <Option key={path} label={edgePathLabels[path]} selected={options.path === path} onClick={() => updateEdgeOptions(id, { path })}><Icon className="size-4" /></Option>;
                  })}
                </ToolbarMenu>
                <ToolbarMenu label="Extremo inicial" trigger={<CapIcon cap={options.start} flip />} contentClassName="grid grid-cols-3">
                  {edgeCaps.map((cap) => <Option key={cap} label={edgeCapLabels[cap]} selected={options.start === cap} onClick={() => updateEdgeOptions(id, { start: cap })}><CapIcon cap={cap} flip /></Option>)}
                </ToolbarMenu>
                <ToolbarMenu label="Extremo final" trigger={<CapIcon cap={options.end} />} contentClassName="grid grid-cols-3">
                  {edgeCaps.map((cap) => <Option key={cap} label={edgeCapLabels[cap]} selected={options.end === cap} onClick={() => updateEdgeOptions(id, { end: cap })}><CapIcon cap={cap} /></Option>)}
                </ToolbarMenu>
                <ToolbarTooltip label="Invertir dirección">
                  <button type="button" aria-label="Invertir dirección" onClick={() => swapEdgeDirection(id)} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text">
                    <ArrowLeftRight className="size-4" />
                  </button>
                </ToolbarTooltip>
                <div className="mx-1 h-5 w-px bg-border" />
                <ToolbarMenu label="Color" trigger={<span className={`mindmap-edge mindmap-tone-${options.color} mindmap-edge-swatch size-4 rounded-full ring-1 ring-border-strong`} />}>
                  {mindMapTones.map((tone) => (
                    <Option key={tone} label={mindMapToneLabels[tone]} selected={options.color === tone} onClick={() => updateEdgeOptions(id, { color: tone })}>
                      <span className={`mindmap-edge mindmap-tone-${tone} mindmap-edge-swatch size-4 rounded-full ${options.color === tone ? "ring-2 ring-text ring-offset-2 ring-offset-surface-raised" : "ring-1 ring-border-strong"}`} />
                    </Option>
                  ))}
                </ToolbarMenu>
                <ToolbarMenu label="Grosor y estilo" trigger={<span className="w-4 rounded-full bg-current" style={{ height: Math.max(1.5, width) }} />}>
                  {edgeWidths.map((value, index) => (
                    <Option key={value} label={["Fino", "Medio", "Grueso"][index]} selected={width === value} onClick={() => updateEdgeOptions(id, { width: value })}>
                      <span className="w-5 rounded-full bg-current" style={{ height: value }} />
                    </Option>
                  ))}
                  <div className="mx-0.5 w-px self-stretch bg-border" />
                  <Option label="Continua" selected={!options.dashed} onClick={() => updateEdgeOptions(id, { dashed: false })}>
                    <svg aria-hidden width={20} height={4}><path d="M1 2H19" stroke="currentColor" strokeWidth={2} /></svg>
                  </Option>
                  <Option label="Discontinua" selected={options.dashed} onClick={() => updateEdgeOptions(id, { dashed: true })}>
                    <svg aria-hidden width={20} height={4}><path d="M1 2H19" stroke="currentColor" strokeWidth={2} strokeDasharray="4 3" /></svg>
                  </Option>
                </ToolbarMenu>
                <div className="mx-1 h-5 w-px bg-border" />
                <ToolbarTooltip label={data?.label ? "Editar etiqueta" : "Añadir etiqueta"}>
                  <button type="button" aria-label="Etiqueta" onClick={startEditing} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text">
                    <Type className="size-4" />
                  </button>
                </ToolbarTooltip>
              </div>
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
