"use client";

import { useRef, useState, type RefObject } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Link2, List, Strikethrough, type LucideIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  fontFamilies,
  fontFamilyLabels,
  fontSizeLabels,
  fontSizes,
  mindMapToneLabels,
  mindMapTones,
  shapeKindLabels,
  shapeKinds,
  stickyToneLabels,
  stickyTones,
  strokeStyleLabels,
  strokeStyles,
  strokeWidthsByTool,
  textAligns,
  type NodeStyle,
  type StrokeStyle,
  type TextAlign,
} from "@/lib/mind-map-style";

import { useMindMap, type EditorSession } from "./mind-map-context";
import { ShapeIcon } from "./shape-icon";
import { ToolbarTooltip } from "./toolbar";
import type { DrawingFlowNode, GroupFlowNode, ShapeFlowNode, StickyFlowNode } from "./types";

export type TextFormat = "bold" | "strike" | "list" | "link";
export type StyledFlowNode = ShapeFlowNode | StickyFlowNode | DrawingFlowNode | GroupFlowNode;

const alignIcons: Record<TextAlign, LucideIcon> = { left: AlignLeft, center: AlignCenter, right: AlignRight };
const alignLabels: Record<TextAlign, string> = { left: "Alinear a la izquierda", center: "Centrar", right: "Alinear a la derecha" };
const fontFamilyCss = { sans: "var(--font-inter), sans-serif", heading: "var(--font-inter-tight), sans-serif", mono: "var(--font-jetbrains-mono), monospace" };

// Evita que pulsar un control quite el foco al texto que se está editando.
const keepEditorFocus = (event: React.MouseEvent) => event.preventDefault();

function StrokePreview({ stroke }: { stroke: StrokeStyle }) {
  return (
    <svg aria-hidden width={18} height={18} viewBox="0 0 18 18">
      {stroke === "none" ? (
        <path d="M3 3L15 15M15 3L3 15" stroke="currentColor" strokeWidth={1.5} />
      ) : (
        <rect x={2.5} y={2.5} width={13} height={13} rx={2} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray={stroke === "dashed" ? "3 2" : undefined} />
      )}
    </svg>
  );
}

function IconButton({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <ToolbarTooltip label={label}>
      <button type="button" aria-label={label} onMouseDown={keepEditorFocus} onClick={onClick} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text">
        <Icon className="size-4" strokeWidth={2} />
      </button>
    </ToolbarTooltip>
  );
}

function Menu({ id, label, openMenu, setOpenMenu, trigger, children, contentClassName = "" }: {
  id: string;
  label: string;
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const open = openMenu === id;
  const { themeClass } = useMindMap();
  return (
    <Popover open={open} onOpenChange={(next) => setOpenMenu(next ? id : null)}>
      <ToolbarTooltip label={label}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={label} onMouseDown={keepEditorFocus} className={`flex h-8 items-center gap-1 rounded-lg px-2 text-text-muted hover:bg-surface-raised hover:text-text ${open ? "bg-surface-raised text-text" : ""}`}>
            {trigger}
          </button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent
        data-mindmap-toolbar
        side="top"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onMouseDown={keepEditorFocus}
        className={`${themeClass} w-auto border-border bg-surface p-1.5 text-text ${contentClassName}`}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({ selected, onClick, children, label }: { selected: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onMouseDown={keepEditorFocus}
      onClick={onClick}
      className={`flex h-8 items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-surface-raised ${selected ? "bg-surface-raised text-text" : "text-text-muted"}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}

// Barra flotante sobre la selección, como en Figma: forma, color (también de
// los grupos), borde,
// tipografía, formato del texto y alineación. Negrita, tachado, enlace y lista
// actúan sobre el texto seleccionado si se está editando, y sobre todo el
// texto de la forma si no.
export function FormatToolbar({
  nodes,
  visible,
  editorSessionRef,
  onStyleChange,
  onColorChange,
  onTextFormat,
}: {
  nodes: StyledFlowNode[];
  visible: boolean;
  editorSessionRef: RefObject<EditorSession | null>;
  onStyleChange: (patch: Partial<NodeStyle>) => void;
  onColorChange: (color: string) => void;
  onTextFormat: (format: TextFormat, url?: string | null) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const savedRangeRef = useRef<Range | null>(null);

  if (nodes.length === 0) return null;

  const first = nodes[0];
  const kind = nodes.every((node) => node.type === first.type) ? first.type : null;
  const hasText = nodes.every((node) => node.type === "SHAPE" || node.type === "STICKY");
  const style: NodeStyle = "style" in first.data ? first.data.style : {};
  const menuProps = { openMenu, setOpenMenu };
  const AlignIcon = alignIcons[style.align ?? (first.type === "SHAPE" ? "center" : "left")];

  const colorOptions = kind === "STICKY"
    ? stickyTones.map((tone) => ({ value: tone, label: stickyToneLabels[tone], className: `mindmap-sticky-${tone}` }))
    : kind === "SHAPE" || kind === "DRAWING" || kind === "GROUP"
      ? mindMapTones.map((tone) => ({ value: tone, label: mindMapToneLabels[tone], className: kind === "DRAWING" ? `mindmap-drawing-stroke mindmap-tone-${tone}` : `mindmap-tone-${tone}` }))
      : [];
  // Un grupo sin color guardado se pinta neutro.
  const currentColor = colorOptions.find((option) => option.value === (first.data.color ?? "neutral")) ?? colorOptions[0];

  const openLink = () => {
    const session = editorSessionRef.current;
    const selection = window.getSelection();
    savedRangeRef.current = session && document.activeElement === session.element && selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    setLinkDraft("");
    setLinkOpen(true);
  };

  // Devuelve el foco y la selección al texto que se editaba antes de abrir el campo del enlace.
  const restoreEditorSelection = () => {
    const range = savedRangeRef.current;
    savedRangeRef.current = null;
    const session = editorSessionRef.current;
    if (!range || !session) return;
    session.element.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const applyLink = (url: string | null) => {
    restoreEditorSelection();
    onTextFormat("link", url);
    setLinkOpen(false);
  };

  return (
    <NodeToolbar nodeId={nodes.map((node) => node.id)} isVisible={visible} position={Position.Top} offset={28} className="nodrag nopan nowheel">
      <div data-mindmap-toolbar className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1 shadow-lg" onMouseDown={keepEditorFocus}>
          {kind === "SHAPE" ? (
            <Menu id="shape" label="Forma" {...menuProps} trigger={<><ShapeIcon shape={style.shape ?? "rounded"} /><ChevronDown className="size-3" /></>} contentClassName="grid grid-cols-3 gap-1">
              {shapeKinds.map((shape) => (
                <MenuItem key={shape} label={shapeKindLabels[shape]} selected={(style.shape ?? "rounded") === shape} onClick={() => onStyleChange({ shape })}>
                  <ShapeIcon shape={shape} size={20} />
                </MenuItem>
              ))}
            </Menu>
          ) : null}

          {currentColor ? (
            <Menu id="color" label="Color" {...menuProps} trigger={<><span className={`mindmap-swatch ${currentColor.className} size-4 rounded-full ring-1 ring-border-strong`} /><ChevronDown className="size-3" /></>} contentClassName="flex gap-1">
              {colorOptions.map((option) => (
                <MenuItem key={option.value} label={option.label} selected={(first.data.color ?? "neutral") === option.value} onClick={() => onColorChange(option.value)}>
                  <span className={`mindmap-swatch ${option.className} size-4 rounded-full ${(first.data.color ?? "neutral") === option.value ? "ring-2 ring-text ring-offset-2 ring-offset-surface-raised" : "ring-1 ring-border-strong"}`} />
                </MenuItem>
              ))}
            </Menu>
          ) : null}

          {kind === "SHAPE" ? (
            <Menu id="stroke" label="Borde" {...menuProps} trigger={<><StrokePreview stroke={style.stroke ?? "solid"} /><ChevronDown className="size-3" /></>} contentClassName="flex flex-col">
              {strokeStyles.map((stroke) => (
                <MenuItem key={stroke} selected={(style.stroke ?? "solid") === stroke} onClick={() => onStyleChange({ stroke })}>
                  <StrokePreview stroke={stroke} /> {strokeStyleLabels[stroke]}
                </MenuItem>
              ))}
            </Menu>
          ) : null}

          {kind === "DRAWING" ? (
            <Menu id="width" label="Grosor" {...menuProps} trigger={<><span className="w-4 rounded-full bg-current" style={{ height: Math.min(style.strokeWidth ?? 4, 8) }} /><ChevronDown className="size-3" /></>} contentClassName="flex flex-col">
              {strokeWidthsByTool[style.tool ?? "pen"].map((width, index) => (
                <MenuItem key={width} selected={style.strokeWidth === width} onClick={() => onStyleChange({ strokeWidth: width })}>
                  <span className="w-5 rounded-full bg-current" style={{ height: 2 + index * 2.5 }} /> {["Fino", "Medio", "Grueso"][index]}
                </MenuItem>
              ))}
            </Menu>
          ) : null}

          {hasText ? (
            <>
              <Divider />
              <Menu id="font" label="Fuente" {...menuProps} trigger={<><span className="text-sm font-medium" style={{ fontFamily: fontFamilyCss[style.font ?? "sans"] }}>Aa</span><ChevronDown className="size-3" /></>} contentClassName="flex flex-col">
                {fontFamilies.map((font) => (
                  <MenuItem key={font} selected={(style.font ?? "sans") === font} onClick={() => onStyleChange({ font })}>
                    <span style={{ fontFamily: fontFamilyCss[font] }}>{fontFamilyLabels[font]}</span>
                  </MenuItem>
                ))}
              </Menu>
              <Menu id="size" label="Tamaño del texto" {...menuProps} trigger={<><span className="min-w-20 text-left text-sm">{fontSizeLabels[style.fontSize ?? "md"]}</span><ChevronDown className="size-3" /></>} contentClassName="flex flex-col">
                {fontSizes.map((fontSize) => (
                  <MenuItem key={fontSize} selected={(style.fontSize ?? "md") === fontSize} onClick={() => onStyleChange({ fontSize })}>
                    {fontSizeLabels[fontSize]}
                  </MenuItem>
                ))}
              </Menu>
              <Divider />
              <IconButton label="Negrita" icon={Bold} onClick={() => onTextFormat("bold")} />
              <IconButton label="Tachado" icon={Strikethrough} onClick={() => onTextFormat("strike")} />
              <IconButton label="Enlace" icon={Link2} onClick={openLink} />
              <IconButton label="Lista" icon={List} onClick={() => onTextFormat("list")} />
              <Divider />
              <Menu id="align" label="Alineación" {...menuProps} trigger={<><AlignIcon className="size-4" /><ChevronDown className="size-3" /></>} contentClassName="flex gap-1">
                {textAligns.map((align) => {
                  const Icon = alignIcons[align];
                  return (
                    <MenuItem key={align} label={alignLabels[align]} selected={style.align === align} onClick={() => onStyleChange({ align })}>
                      <Icon className="size-4" />
                    </MenuItem>
                  );
                })}
              </Menu>
            </>
          ) : null}
        </div>

        {linkOpen && hasText ? (
          <form
            className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-lg"
            onSubmit={(event) => { event.preventDefault(); applyLink(linkDraft); }}
          >
            <input
              autoFocus
              value={linkDraft}
              onChange={(event) => setLinkDraft(event.target.value)}
              placeholder="Pega o escribe un enlace…"
              className="h-8 w-64 rounded-lg bg-surface-raised px-2 text-sm text-text outline-none placeholder:text-text-faint"
              onKeyDown={(event) => {
                if (event.key !== "Escape") return;
                event.preventDefault();
                event.stopPropagation();
                restoreEditorSelection();
                setLinkOpen(false);
              }}
              onBlur={(event) => {
                if ((event.relatedTarget as HTMLElement | null)?.closest("[data-mindmap-toolbar]")) return;
                setLinkOpen(false);
                // Si se editaba texto y el foco se va fuera, la edición termina.
                if (savedRangeRef.current) editorSessionRef.current?.finish();
                savedRangeRef.current = null;
              }}
            />
            <button type="submit" onMouseDown={keepEditorFocus} className="h-8 rounded-lg bg-accent px-3 text-sm font-medium text-bg hover:bg-accent-hover">Aplicar</button>
            <button type="button" onMouseDown={keepEditorFocus} onClick={() => applyLink(null)} className="h-8 rounded-lg px-3 text-sm text-text-muted hover:bg-surface-raised hover:text-text">Quitar</button>
          </form>
        ) : null}
      </div>
    </NodeToolbar>
  );
}
