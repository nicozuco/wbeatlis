"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  Eraser,
  Expand,
  Focus,
  Frame,
  Hand,
  Highlighter,
  ImageDown,
  ImagePlus,
  Lightbulb,
  Link2,
  Moon,
  MousePointer2,
  Pencil,
  Radar,
  Save,
  Shapes,
  Shrink,
  Sun,
  Table2,
  type LucideIcon,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  mindMapToneLabels,
  mindMapTones,
  shapeKindLabels,
  shapeKinds,
  stickyToneLabels,
  stickyTones,
  strokeWidthsByTool,
  type DrawingTool,
  type MindMapTheme,
  type MindMapTone,
  type ShapeKind,
  type StickyTone,
} from "@/lib/mind-map-style";

import { useMindMap } from "./mind-map-context";
import { ShapeIcon } from "./shape-icon";

// "sticky": el siguiente clic en el lienzo coloca un pósit del color elegido.
// "table": hacer clic y arrastrar en el lienzo crea una tabla de ese tamaño.
export type CanvasTool = "select" | "hand" | DrawingTool | "eraser" | "sticky" | "table";
export type SaveStatus = "idle" | "saving" | "saved";
export type DrawSettings = Record<DrawingTool, { color: MindMapTone; width: number }>;
export type ToolbarNodeKind = "STICKY" | "CLIENT" | "COMPETITOR" | "CONTENT_IDEA" | "GROUP";

type FreehandTool = DrawingTool | "eraser";

const toolButtons: { tool: CanvasTool; label: string; shortcut: string; icon: LucideIcon }[] = [
  { tool: "select", label: "Seleccionar", shortcut: "V", icon: MousePointer2 },
  { tool: "hand", label: "Mano", shortcut: "H", icon: Hand },
];

const freehandTools: { tool: FreehandTool; label: string; shortcut: string; icon: LucideIcon }[] = [
  { tool: "pen", label: "Lápiz", shortcut: "P", icon: Pencil },
  { tool: "highlighter", label: "Rotulador", shortcut: "M", icon: Highlighter },
  { tool: "eraser", label: "Goma", shortcut: "E", icon: Eraser },
];

const recordButtons: { kind: ToolbarNodeKind; label: string; icon: LucideIcon }[] = [
  { kind: "CLIENT", label: "Cliente", icon: Building2 },
  { kind: "COMPETITOR", label: "Competidor", icon: Radar },
  { kind: "CONTENT_IDEA", label: "Idea de contenido", icon: Lightbulb },
  { kind: "GROUP", label: "Grupo", icon: Frame },
];

export function ToolbarTooltip({ label, shortcut, children }: { label: string; shortcut?: string; children: React.ReactNode }) {
  const { themeClass } = useMindMap();
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className={`${themeClass} border border-border bg-surface-raised text-text`}>
        {label}
        {shortcut ? <span className="ml-2 font-mono text-text-faint">{shortcut}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

function ToolbarButton({
  label,
  shortcut,
  icon: Icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <ToolbarTooltip label={label} shortcut={shortcut}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={`grid size-10 place-items-center rounded-lg transition-colors disabled:opacity-50 ${active ? "bg-accent text-bg" : "text-text-muted hover:bg-surface-raised hover:text-text"}`}
      >
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </button>
    </ToolbarTooltip>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-border" />;
}

// Fila flotante encima de la barra con las opciones de la herramienta activa.
function OptionsRow({ children }: { children: React.ReactNode }) {
  return <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-surface p-1.5 shadow-lg">{children}</div>;
}

function Swatch({ label, selected, className, onClick }: { label: string; selected: boolean; className: string; onClick: () => void }) {
  return (
    <ToolbarTooltip label={label}>
      <button type="button" aria-label={label} aria-pressed={selected} onClick={onClick} className="grid size-8 place-items-center rounded-lg hover:bg-surface-raised">
        <span className={`mindmap-swatch ${className} size-[18px] rounded-full ${selected ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "ring-1 ring-border-strong"}`} />
      </button>
    </ToolbarTooltip>
  );
}

// Pósit en miniatura con la esquina doblada, del color que se va a colocar.
function StickyIcon({ color }: { color: StickyTone }) {
  return (
    <span className={`mindmap-swatch mindmap-sticky-${color} relative block size-5 rounded-[3px] shadow-[0_1px_2px_rgb(0_0_0/0.25)] ring-1 ring-black/10`} style={{ clipPath: "polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)" }} />
  );
}

// Barra inferior tipo FigJam: Seleccionar y Mano; un único botón de dibujo
// (lápiz, rotulador o goma) cuya fila de opciones aparece encima con los
// grosores y colores; el pósit como herramienta con su fila de colores; formas,
// imágenes, enlaces y nodos vinculados; vista, tema del lienzo y guardado.
export function MindMapToolbar({
  tool,
  onToolChange,
  drawSettings,
  onDrawSettingsChange,
  stickyColor,
  onStickyColorChange,
  onAddNode,
  onAddShape,
  onPickImages,
  onAddLink,
  onFitView,
  onExportPng,
  exporting,
  theme,
  onToggleTheme,
  fullscreen,
  onToggleFullscreen,
  dirty,
  saveStatus,
  onSave,
}: {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  drawSettings: DrawSettings;
  onDrawSettingsChange: (tool: DrawingTool, settings: { color: MindMapTone; width: number }) => void;
  stickyColor: StickyTone;
  onStickyColorChange: (color: StickyTone) => void;
  onAddNode: (kind: ToolbarNodeKind) => void;
  onAddShape: (shape: ShapeKind) => void;
  onPickImages: () => void;
  onAddLink: (url: string) => void;
  onFitView: () => void;
  onExportPng: () => void;
  exporting: boolean;
  theme: MindMapTheme;
  onToggleTheme: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  dirty: boolean;
  saveStatus: SaveStatus;
  onSave: () => void;
}) {
  const { themeClass } = useMindMap();
  const [shapesOpen, setShapesOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [lastFreehand, setLastFreehand] = useState<FreehandTool>("pen");
  const saving = saveStatus === "saving";

  const freehand: FreehandTool | null = tool === "pen" || tool === "highlighter" || tool === "eraser" ? tool : null;
  // El botón de dibujo recuerda la última herramienta usada (también si se eligió con el teclado).
  if (freehand && freehand !== lastFreehand) setLastFreehand(freehand);
  const currentFreehand = freehand ?? lastFreehand;
  const FreehandIcon = freehandTools.find((item) => item.tool === currentFreehand)?.icon ?? Pencil;
  const drawingTool = tool === "pen" || tool === "highlighter" ? tool : null;
  const settings = drawingTool ? drawSettings[drawingTool] : null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
      {freehand ? (
        <OptionsRow>
          {freehandTools.map((item) => (
            <ToolbarTooltip key={item.tool} label={item.label} shortcut={item.shortcut}>
              <button
                type="button"
                aria-label={item.label}
                aria-pressed={tool === item.tool}
                onClick={() => onToolChange(item.tool)}
                className={`grid size-8 place-items-center rounded-lg transition-colors ${tool === item.tool ? "bg-accent-soft text-accent" : "text-text-muted hover:bg-surface-raised hover:text-text"}`}
              >
                <item.icon className="size-4" strokeWidth={1.8} />
              </button>
            </ToolbarTooltip>
          ))}
          {drawingTool && settings ? (
            <>
              <Divider />
              {strokeWidthsByTool[drawingTool].map((width, index) => (
                <ToolbarTooltip key={width} label={["Fino", "Medio", "Grueso"][index]}>
                  <button
                    type="button"
                    aria-label={["Fino", "Medio", "Grueso"][index]}
                    aria-pressed={settings.width === width}
                    onClick={() => onDrawSettingsChange(drawingTool, { ...settings, width })}
                    className={`grid size-8 place-items-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text ${settings.width === width ? "bg-surface-raised text-text" : ""}`}
                  >
                    <span className="w-4 rounded-full bg-current" style={{ height: 2 + index * 2.5 }} />
                  </button>
                </ToolbarTooltip>
              ))}
              <Divider />
              {mindMapTones.map((tone) => (
                <Swatch
                  key={tone}
                  label={mindMapToneLabels[tone]}
                  selected={settings.color === tone}
                  className={`mindmap-drawing-stroke mindmap-tone-${tone}`}
                  onClick={() => onDrawSettingsChange(drawingTool, { ...settings, color: tone })}
                />
              ))}
            </>
          ) : null}
        </OptionsRow>
      ) : null}

      {tool === "sticky" ? (
        <OptionsRow>
          {stickyTones.map((tone) => (
            <Swatch key={tone} label={stickyToneLabels[tone]} selected={stickyColor === tone} className={`mindmap-sticky-${tone}`} onClick={() => onStickyColorChange(tone)} />
          ))}
          <span className="px-2 text-xs whitespace-nowrap text-text-faint">Haz clic en el lienzo para colocarlo</span>
        </OptionsRow>
      ) : null}

      {tool === "table" ? (
        <OptionsRow>
          <span className="px-2 py-1.5 text-xs whitespace-nowrap text-text-muted">Haz clic y arrastra en el lienzo para elegir filas y columnas</span>
        </OptionsRow>
      ) : null}

      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
        {toolButtons.map((item) => (
          <ToolbarButton key={item.tool} label={item.label} shortcut={item.shortcut} icon={item.icon} active={tool === item.tool} onClick={() => onToolChange(item.tool)} />
        ))}
        <Divider />
        <ToolbarButton label="Dibujar" shortcut="P" icon={FreehandIcon} active={Boolean(freehand)} onClick={() => onToolChange(currentFreehand)} />
        <ToolbarTooltip label="Pósit" shortcut="S">
          <button
            type="button"
            aria-label="Pósit"
            aria-pressed={tool === "sticky"}
            onClick={() => onToolChange(tool === "sticky" ? "select" : "sticky")}
            className={`grid size-10 place-items-center rounded-lg transition-colors ${tool === "sticky" ? "bg-accent-soft" : "hover:bg-surface-raised"}`}
          >
            <StickyIcon color={stickyColor} />
          </button>
        </ToolbarTooltip>
        <Popover open={shapesOpen} onOpenChange={setShapesOpen}>
          <ToolbarTooltip label="Forma" shortcut="R">
            <PopoverTrigger asChild>
              <button type="button" aria-label="Forma" className={`grid size-10 place-items-center rounded-lg transition-colors ${shapesOpen ? "bg-surface-raised text-text" : "text-text-muted hover:bg-surface-raised hover:text-text"}`}>
                <Shapes className="size-[18px]" strokeWidth={1.8} />
              </button>
            </PopoverTrigger>
          </ToolbarTooltip>
          <PopoverContent side="top" sideOffset={10} className={`${themeClass} grid w-auto grid-cols-3 gap-1 border-border bg-surface p-1.5`}>
            {shapeKinds.map((shape) => (
              <ToolbarTooltip key={shape} label={shapeKindLabels[shape]}>
                <button
                  type="button"
                  aria-label={shapeKindLabels[shape]}
                  onClick={() => { onAddShape(shape); setShapesOpen(false); }}
                  className="grid size-10 place-items-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text"
                >
                  <ShapeIcon shape={shape} size={20} />
                </button>
              </ToolbarTooltip>
            ))}
          </PopoverContent>
        </Popover>
        <ToolbarButton label="Tabla" shortcut="T" icon={Table2} active={tool === "table"} onClick={() => onToolChange(tool === "table" ? "select" : "table")} />
        <ToolbarButton label="Imagen" shortcut="I" icon={ImagePlus} onClick={onPickImages} />
        <Popover open={linkOpen} onOpenChange={(open) => { setLinkOpen(open); if (open) setLinkDraft(""); }}>
          <ToolbarTooltip label="Enlace">
            <PopoverTrigger asChild>
              <button type="button" aria-label="Enlace" className={`grid size-10 place-items-center rounded-lg transition-colors ${linkOpen ? "bg-surface-raised text-text" : "text-text-muted hover:bg-surface-raised hover:text-text"}`}>
                <Link2 className="size-[18px]" strokeWidth={1.8} />
              </button>
            </PopoverTrigger>
          </ToolbarTooltip>
          <PopoverContent side="top" sideOffset={10} className={`${themeClass} w-auto border-border bg-surface p-1.5`}>
            <form
              className="flex items-center gap-1"
              onSubmit={(event) => {
                event.preventDefault();
                if (!linkDraft.trim()) return;
                onAddLink(linkDraft);
                setLinkOpen(false);
              }}
            >
              <input
                autoFocus
                value={linkDraft}
                onChange={(event) => setLinkDraft(event.target.value)}
                placeholder="Pega un enlace (YouTube, Instagram, web…)"
                className="h-8 w-72 rounded-lg bg-surface-raised px-2 text-sm text-text outline-none placeholder:text-text-faint"
              />
              <button type="submit" className="h-8 rounded-lg bg-accent px-3 text-sm font-medium text-bg hover:bg-accent-hover">Añadir</button>
            </form>
            <p className="px-1 pt-1.5 text-[11px] text-text-faint">También puedes pegar enlaces e imágenes directamente en el lienzo (⌘V).</p>
          </PopoverContent>
        </Popover>
        {recordButtons.map((item) => (
          <ToolbarButton key={item.kind} label={item.label} icon={item.icon} onClick={() => onAddNode(item.kind)} />
        ))}
        <Divider />
        <ToolbarButton label="Ajustar a la vista" icon={Focus} onClick={onFitView} />
        <ToolbarButton label={exporting ? "Exportando…" : "Exportar como PNG"} icon={ImageDown} disabled={exporting} onClick={onExportPng} />
        <ToolbarButton label={theme === "light" ? "Lienzo oscuro" : "Lienzo claro"} icon={theme === "light" ? Moon : Sun} onClick={onToggleTheme} />
        <ToolbarButton label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"} shortcut="F" icon={fullscreen ? Shrink : Expand} active={fullscreen} onClick={onToggleFullscreen} />
        <Divider />
        <span className="relative flex h-10 min-w-32 items-center justify-end px-2 text-xs" aria-live="polite">
          {dirty ? (
            <span className="whitespace-nowrap text-text-muted">Cambios sin guardar</span>
          ) : (
            <span className={`flex items-center gap-1 whitespace-nowrap text-success transition-opacity duration-500 ${saveStatus === "saved" ? "opacity-100" : "opacity-0"}`}>
              <Check className="size-3.5" /> Guardado
            </span>
          )}
        </span>
        <ToolbarTooltip label="Guardar mapa" shortcut="⌘S / Ctrl+S">
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className={`flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-default ${dirty ? "bg-accent text-bg hover:bg-accent-hover" : "text-text-faint"}`}
          >
            {saving ? <Spinner /> : <Save className="size-4" />} Guardar
          </button>
        </ToolbarTooltip>
      </div>
    </div>
  );
}
