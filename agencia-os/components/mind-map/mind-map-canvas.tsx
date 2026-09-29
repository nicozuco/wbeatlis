"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  getNodesBounds,
  getViewportForBounds,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type OnConnectEnd,
  type OnReconnect,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { toPng } from "html-to-image";
import { toast } from "sonner";

import { getClinicDetail, getLinkPreview, getMindMapRecords, saveMindMap } from "@/app/actions";
import { ClientSheet, type ClientData } from "@/components/clients/clients-workspace";
import { useUnsavedGuard } from "@/components/shared/unsaved-changes";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { MindMapNodeKindValue } from "@/lib/domain";
import { DEFAULT_EDGE_OPTIONS, TABLE_CELL_HEIGHT, TABLE_CELL_WIDTH, type DrawingTool, type EdgeOptions, type MindMapTheme, type NodeStyle, type ShapeKind, type StickyTone, type TableMedia } from "@/lib/mind-map-style";
import { normalizeLinkUrl, toggleWholeFormat } from "@/lib/rich-text";

import { ConvertIdeaDialog, type ConvertedContent } from "./convert-idea-dialog";
import { LabeledEdge } from "./edges/labeled-edge";
import { FormatToolbar, type StyledFlowNode, type TextFormat } from "./format-toolbar";
import { strokeHitsPoint, strokeToNodeBox, type Point } from "./geometry";
import { canReparentNodeToGroup, CLONE_GAP, DEFAULT_NODE_SIZE, fromFlowEdge, fromFlowNode, referencedRecordIds, sortNodesParentFirst, toFlowEdge, toFlowNode, type RawMindMapNode } from "./graph-utils";
import { GroupNavigator } from "./group-navigator";
import { MindMapProvider, type EditorSession, type MindMapContextValue } from "./mind-map-context";
import { ClientNode } from "./nodes/client-node";
import { CompetitorNode } from "./nodes/competitor-node";
import { ContentIdeaNode } from "./nodes/content-idea-node";
import { DrawingNode } from "./nodes/drawing-node";
import { GroupNode } from "./nodes/group-node";
import { ImageNode } from "./nodes/image-node";
import { LinkNode } from "./nodes/link-node";
import { ShapeNode } from "./nodes/shape-node";
import { StickyNode } from "./nodes/sticky-node";
import { TableNode } from "./nodes/table-node";
import { RecordPicker, type ClinicResult, type CompetitorResult } from "./record-picker";
import { MindMapToolbar, type CanvasTool, type DrawSettings, type SaveStatus, type ToolbarNodeKind } from "./toolbar";
import type { MindMapFlowEdge, MindMapFlowNode, MindMapRecords } from "./types";
import { useFreehand } from "./use-freehand";
import { useTableTool, type TableBox } from "./use-table-tool";

const nodeTypes = { SHAPE: ShapeNode, STICKY: StickyNode, DRAWING: DrawingNode, CLIENT: ClientNode, COMPETITOR: CompetitorNode, CONTENT_IDEA: ContentIdeaNode, GROUP: GroupNode, IMAGE: ImageNode, LINK: LinkNode, TABLE: TableNode };
const edgeTypes = { labeled: LabeledEdge };

type XY = { x: number; y: number };

const OPPOSITE_SIDE: Record<Position, Position> = { top: Position.Bottom, bottom: Position.Top, left: Position.Right, right: Position.Left };
const TOOL_SHORTCUTS: Record<string, CanvasTool> = { v: "select", h: "hand", p: "pen", m: "highlighter", e: "eraser", t: "table" };
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
// Tamaño máximo con el que aparece una imagen nueva en el lienzo (luego se puede agrandar).
const IMAGE_MAX_SIDE = 480;
// Por encima de esto una imagen se reduce en el navegador antes de subirla.
const IMAGE_UPLOAD_MAX_SIDE = 2400;
const IMAGE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
// Imagen transparente que usa la exportación a PNG cuando no puede leer una miniatura de otro dominio.
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const isStyled = (node: MindMapFlowNode): node is StyledFlowNode => node.type === "SHAPE" || node.type === "STICKY" || node.type === "DRAWING" || node.type === "GROUP";
const isDrawingTool = (tool: CanvasTool) => tool === "pen" || tool === "highlighter" || tool === "eraser";

// Tema del lienzo guardado en este navegador. Si el almacenamiento no está
// disponible (modo privado, datos bloqueados) se recuerda solo en memoria.
const THEME_KEY = "atlis:mindmap-theme";
const themeListeners = new Set<() => void>();
let memoryTheme: MindMapTheme = "dark";

function readTheme(): MindMapTheme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Sin acceso al almacenamiento: vale el tema en memoria.
  }
  return memoryTheme;
}

function writeTheme(theme: MindMapTheme) {
  memoryTheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Se queda solo en memoria.
  }
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Una línea pegada que es solo una dirección web (con o sin protocolo).
function pastedUrl(text: string): string | null {
  const value = text.trim();
  if (!value || /\s/.test(value)) return null;
  if (!/^https?:\/\//i.test(value) && !/^www\.[^.]+\.[a-z]{2,}/i.test(value)) return null;
  const href = normalizeLinkUrl(value);
  try {
    return href && /^https?:/i.test(href) ? new URL(href).toString() : null;
  } catch {
    return null;
  }
}

function loadImageSize(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function fitImageBox(size: { width: number; height: number } | null) {
  if (!size || !size.width || !size.height) return { width: 320, height: 220 };
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(size.width, size.height));
  return { width: Math.max(48, Math.round(size.width * scale)), height: Math.max(48, Math.round(size.height * scale)) };
}

// Las fotos muy grandes (capturas retina, fotos del móvil) se reducen a WebP
// antes de subirlas. Los GIF se suben tal cual para no perder la animación.
async function prepareImageForUpload(file: File, size: { width: number; height: number } | null): Promise<File> {
  if (file.type === "image/gif" || !size) return file;
  const longest = Math.max(size.width, size.height);
  if (file.size <= IMAGE_UPLOAD_MAX_BYTES && longest <= IMAGE_UPLOAD_MAX_SIDE) return file;
  try {
    const scale = Math.min(1, IMAGE_UPLOAD_MAX_SIDE / longest);
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(size.width * scale);
    canvas.height = Math.round(size.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    return blob && blob.size < file.size ? new File([blob], "imagen.webp", { type: "image/webp" }) : file;
  } catch {
    return file;
  }
}
// Lado de `box` que mira hacia `point`: por ahí entra la conexión.
function sideFacing(box: { x: number; y: number; width: number; height: number }, point: XY): Position {
  const dx = point.x - (box.x + box.width / 2);
  const dy = point.y - (box.y + box.height / 2);
  if (Math.abs(dx) * box.height > Math.abs(dy) * box.width) return dx < 0 ? Position.Left : Position.Right;
  return dy < 0 ? Position.Top : Position.Bottom;
}

// El lienzo trabaja solo en memoria: mover, conectar, redimensionar, editar o
// dibujar no escribe en base de datos. "Guardar" (o Cmd/Ctrl+S) envía el mapa
// entero en una única petición; si alguien lo guardó desde que se cargó, se
// ofrece sobrescribir o recargar en vez de pisarlo.
function MindMapCanvasInner({
  mapId,
  mapName,
  initialNodes,
  initialEdges,
  initialRecords,
  initialMapUpdatedAt,
}: {
  mapId: string;
  mapName: string;
  initialNodes: MindMapFlowNode[];
  initialEdges: MindMapFlowEdge[];
  initialRecords: MindMapRecords;
  initialMapUpdatedAt: string;
}) {
  const router = useRouter();
  const reactFlow = useReactFlow<MindMapFlowNode, MindMapFlowEdge>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapFlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapFlowEdge>(initialEdges);
  const [records, setRecords] = useState<MindMapRecords>(initialRecords);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [conflictOpen, setConflictOpen] = useState(false);
  const [recordPickerKind, setRecordPickerKind] = useState<"CLIENT" | "COMPETITOR" | null>(null);
  const [convertTarget, setConvertTarget] = useState<{ nodeId: string; text: string } | null>(null);
  const [clientSheetTarget, setClientSheetTarget] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [tool, setTool] = useState<CanvasTool>("select");
  const [drawSettings, setDrawSettings] = useState<DrawSettings>({ pen: { color: "neutral", width: 4 }, highlighter: { color: "warning", width: 20 } });
  const [stickyColor, setStickyColor] = useState<StickyTone>("yellow");
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as const);
  const themeClass = theme === "light" ? "mindmap-theme-light" : "";
  const [fullscreen, setFullscreen] = useState(false);
  const [editRequest, setEditRequest] = useState<{ nodeId: string; nonce: number } | null>(null);
  const [erasingIds, setErasingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [labelEditRequest, setLabelEditRequest] = useState<{ edgeId: string; nonce: number } | null>(null);
  // Estilo de la última conexión que se retocó: las conexiones nuevas salen igual, como en FigJam.
  const lastEdgeOptionsRef = useRef<Required<EdgeOptions>>({ ...DEFAULT_EDGE_OPTIONS });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPointerRef = useRef<XY | null>(null);

  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  const edgesRef = useRef(edges);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const dirtyRef = useRef(false);
  const changeVersionRef = useRef(0);
  const savingRef = useRef(false);
  const baselineUpdatedAtRef = useRef(initialMapUpdatedAt);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef(new Map<string, XY>());
  const editorSessionRef = useRef<EditorSession | null>(null);
  const erasingRef = useRef(new Set<string>());

  const markDirty = useCallback(() => {
    changeVersionRef.current += 1;
    dirtyRef.current = true;
    setDirty(true);
  }, []);

  // ── Guardado ─────────────────────────────────────────────────────────────
  const performSave = useCallback(async (force: boolean): Promise<boolean> => {
    if (savingRef.current) return false;
    if (nodesRef.current.some((node) => (node.type === "IMAGE" && node.data.uploading) || (node.type === "LINK" && node.data.loading))) {
      toast.info("Espera a que terminen de cargarse las imágenes y enlaces");
      return false;
    }
    // Una edición de texto en curso se confirma en onBlur: se fuerza antes de leer el estado.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    savingRef.current = true;
    setSaveStatus("saving");
    const version = changeVersionRef.current;
    const nodeIds = new Set(nodesRef.current.map((node) => node.id));
    try {
      const result = await saveMindMap({
        mapId,
        expectedUpdatedAt: baselineUpdatedAtRef.current,
        force,
        nodes: nodesRef.current.map(fromFlowNode),
        edges: edgesRef.current.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)).map(fromFlowEdge),
      });
      if (result.status === "conflict") {
        setSaveStatus("idle");
        setConflictOpen(true);
        return false;
      }
      baselineUpdatedAtRef.current = result.updatedAt;
      // Si hubo cambios mientras se guardaba, siguen pendientes.
      if (changeVersionRef.current === version) {
        dirtyRef.current = false;
        setDirty(false);
      }
      setSaveStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      return true;
    } catch {
      setSaveStatus("idle");
      toast.error("No se pudo guardar el mapa");
      return false;
    } finally {
      savingRef.current = false;
    }
  }, [mapId]);

  const save = useCallback(() => performSave(false), [performSave]);

  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); }, []);

  useUnsavedGuard({ isDirty: () => dirtyRef.current, save });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const reloadFromServer = () => {
    dirtyRef.current = false;
    setDirty(false);
    setConflictOpen(false);
    router.refresh();
  };

  // ── Datos en vivo de los registros vinculados: al volver a la pestaña ────
  const refreshRecords = useCallback(async () => {
    const fresh = await getMindMapRecords(referencedRecordIds(nodesRef.current)).catch(() => null);
    if (fresh) setRecords(fresh);
  }, []);

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === "visible") void refreshRecords(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refreshRecords]);

  // ── Pantalla completa ────────────────────────────────────────────────────
  // El lienzo pasa a ocupar toda la ventana y, si el navegador lo permite,
  // también toda la pantalla. Se usa el documento entero (no solo el lienzo)
  // para que los paneles y diálogos, que se abren fuera de él, sigan visibles.
  const toggleFullscreen = useCallback(() => {
    if (fullscreen) {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      setFullscreen(false);
      return;
    }
    setFullscreen(true);
    void document.documentElement.requestFullscreen?.().catch(() => {});
  }, [fullscreen]);

  useEffect(() => {
    const handleChange = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  useEffect(() => () => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); }, []);

  // ── Ediciones desde nodos y conexiones ───────────────────────────────────
  const updateNodeText = useCallback((nodeId: string, text: string) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId && "text" in n.data ? ({ ...n, data: { ...n.data, text } } as MindMapFlowNode) : n)));
    markDirty();
  }, [setNodes, markDirty]);

  const updateTable = useCallback((nodeId: string, media: TableMedia, size?: { width: number; height: number }) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId && n.type === "TABLE" ? { ...n, ...(size ? { width: size.width, height: size.height } : {}), data: { media } } : n)));
    markDirty();
  }, [setNodes, markDirty]);

  const resizeNode = useCallback((nodeId: string, params: { x: number; y: number; width: number; height: number }) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, position: { x: params.x, y: params.y }, width: params.width, height: params.height } : n)));
    markDirty();
  }, [setNodes, markDirty]);

  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...toFlowEdge({ ...fromFlowEdge(e), label: label.trim() ? label : null }), selected: e.selected } : e)));
    markDirty();
  }, [setEdges, markDirty]);

  const updateEdgeOptions = useCallback((edgeId: string, patch: EdgeOptions) => {
    lastEdgeOptionsRef.current = { ...lastEdgeOptionsRef.current, ...patch };
    setEdges((eds) => eds.map((e) => (e.id === edgeId && e.data ? { ...e, data: { ...e.data, options: { ...e.data.options, ...patch } } } : e)));
    markDirty();
  }, [setEdges, markDirty]);

  const swapEdgeDirection = useCallback((edgeId: string) => {
    setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, source: e.target, target: e.source, sourceHandle: e.targetHandle, targetHandle: e.sourceHandle } : e)));
    markDirty();
  }, [setEdges, markDirty]);

  const handleEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: MindMapFlowEdge) => {
    setLabelEditRequest({ edgeId: edge.id, nonce: Date.now() });
  }, []);

  // Arrastrar el extremo de una conexión seleccionada la lleva a otro nodo o conector.
  const handleReconnect = useCallback<OnReconnect<MindMapFlowEdge>>((oldEdge, connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    setEdges((eds) => eds.map((e) => (e.id === oldEdge.id ? { ...e, source: connection.source, target: connection.target, sourceHandle: connection.sourceHandle, targetHandle: connection.targetHandle } : e)));
    markDirty();
  }, [setEdges, markDirty]);

  const clearEditRequest = useCallback((nodeId: string) => {
    setEditRequest((request) => (request?.nodeId === nodeId ? null : request));
  }, []);

  // ── Barra de formato ─────────────────────────────────────────────────────
  const updateSelectedStyle = useCallback((patch: Partial<NodeStyle>) => {
    setNodes((nds) => nds.map((n) => (n.selected && isStyled(n) && "style" in n.data ? ({ ...n, data: { ...n.data, style: { ...n.data.style, ...patch } } } as MindMapFlowNode) : n)));
    markDirty();
  }, [setNodes, markDirty]);

  const updateSelectedColor = useCallback((color: string) => {
    setNodes((nds) => nds.map((n) => (n.selected && isStyled(n) ? ({ ...n, data: { ...n.data, color } } as MindMapFlowNode) : n)));
    markDirty();
  }, [setNodes, markDirty]);

  const applyTextFormat = useCallback((format: TextFormat, url?: string | null) => {
    const session = editorSessionRef.current;
    if (session && document.activeElement === session.element) {
      // Editando: el formato se aplica a la selección de texto y se guarda al terminar la edición.
      if (format === "link") {
        const href = url ? normalizeLinkUrl(url) : null;
        document.execCommand(href ? "createLink" : "unlink", false, href ?? undefined);
      } else {
        document.execCommand(format === "bold" ? "bold" : format === "strike" ? "strikeThrough" : "insertUnorderedList");
      }
      return;
    }
    setNodes((nds) => nds.map((n) => ((n.type === "SHAPE" || n.type === "STICKY") && n.selected ? ({ ...n, data: { ...n.data, text: toggleWholeFormat(n.data.text, format, url) } } as MindMapFlowNode) : n)));
    markDirty();
  }, [setNodes, markDirty]);

  // ── Ficha de cliente / conversión de idea ────────────────────────────────
  const openClientSheet = useCallback((clinicId: string) => {
    setClientSheetTarget(clinicId);
    setClientDetail(null);
    void getClinicDetail(clinicId).then(setClientDetail);
  }, []);

  const openConvertDialog = useCallback((nodeId: string, currentText: string) => { setConvertTarget({ nodeId, text: currentText }); }, []);

  // Doble clic en un nodo Cliente abre su ficha; un clic simple solo selecciona.
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: MindMapFlowNode) => {
    if (node.type === "CLIENT" && node.data.clinicId) openClientSheet(node.data.clinicId);
  }, [openClientSheet]);

  const handleConverted = useCallback((nodeId: string, content: ConvertedContent) => {
    setRecords((r) => ({ ...r, contentItems: { ...r.contentItems, [content.id]: { title: content.title, status: content.status, format: content.format } } }));
    setNodes((nds) => nds.map((n) => (n.id === nodeId && n.type === "CONTENT_IDEA" ? { ...n, data: { text: "", contentItemId: content.id } } : n)));
    markDirty();
  }, [setNodes, markDirty]);

  // ── Creación de nodos y conexiones ───────────────────────────────────────
  // `center` es el punto del lienzo donde queda el centro del nodo nuevo.
  const addNode = useCallback((kind: MindMapNodeKindValue, center: XY, extra: Partial<RawMindMapNode> = {}, edit = false) => {
    const width = extra.width ?? DEFAULT_NODE_SIZE[kind].width;
    const height = extra.height ?? DEFAULT_NODE_SIZE[kind].height;
    const id = crypto.randomUUID();
    const node = toFlowNode({
      id,
      kind,
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
      parentId: null,
      text: null,
      // Forma nueva: blanca con borde gris, como en FigJam.
      color: kind === "SHAPE" ? "white" : kind === "STICKY" ? "yellow" : null,
      clinicId: null,
      competitorId: null,
      contentItemId: null,
      style: null,
      points: null,
      media: null,
      ...extra,
    });
    setNodes((nds) => sortNodesParentFirst([...nds.map((n) => (n.selected ? { ...n, selected: false } : n)), { ...node, selected: true }]));
    markDirty();
    if (edit) setEditRequest({ nodeId: id, nonce: Date.now() });
  }, [setNodes, markDirty]);

  const viewportCenter = useCallback((jitter = 0): XY => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const offset = () => (jitter ? Math.random() * jitter * 2 - jitter : 0);
    const screenPoint = rect ? { x: rect.left + rect.width / 2 + offset(), y: rect.top + rect.height / 2 + offset() } : { x: 200, y: 200 };
    return reactFlow.screenToFlowPosition(screenPoint);
  }, [reactFlow]);

  const addShape = useCallback((shape: ShapeKind) => addNode("SHAPE", viewportCenter(30), { style: { shape } }), [addNode, viewportCenter]);

  const handlePaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (isDrawingTool(tool) || !target.classList.contains("react-flow__pane")) return;
    addNode("SHAPE", reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }), { style: { shape: "rounded" } }, true);
  }, [tool, reactFlow, addNode]);

  // Con la herramienta Pósit, un clic en el lienzo coloca el pósit ahí y vuelve a Seleccionar.
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    if (tool !== "sticky") return;
    addNode("STICKY", reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }), { color: stickyColor }, true);
    setTool("select");
  }, [tool, reactFlow, addNode, stickyColor]);

  const handleToolbarAdd = useCallback((kind: ToolbarNodeKind) => {
    if (kind === "CLIENT" || kind === "COMPETITOR") { setRecordPickerKind(kind); return; }
    addNode(kind, viewportCenter(30), {}, kind === "STICKY");
  }, [addNode, viewportCenter]);

  const handleRecordPicked = useCallback((row: ClinicResult | CompetitorResult) => {
    const position = viewportCenter();
    if ("name" in row) {
      setRecords((r) => ({ ...r, clinics: { ...r.clinics, [row.id]: { name: row.name, phase: row.phase, nextFollowUpAt: row.nextFollowUpAt } } }));
      addNode("CLIENT", position, { clinicId: row.id });
    } else {
      setRecords((r) => ({ ...r, competitors: { ...r.competitors, [row.id]: { company: row.company, threatLevel: row.threatLevel, followersCount: row.followersCount } } }));
      addNode("COMPETITOR", position, { competitorId: row.id });
    }
    setRecordPickerKind(null);
  }, [addNode, viewportCenter]);

  // ── Imágenes y enlaces ───────────────────────────────────────────────────
  // Punto donde colocar lo pegado: el puntero si está sobre el lienzo, si no el centro de la vista.
  const pastePosition = useCallback((): XY => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const pointer = lastPointerRef.current;
    if (rect && pointer && pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) return reactFlow.screenToFlowPosition(pointer);
    return viewportCenter(30);
  }, [reactFlow, viewportCenter]);

  const patchNodeData = useCallback((nodeId: string, patch: (node: MindMapFlowNode) => MindMapFlowNode) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? patch(n) : n)));
  }, [setNodes]);

  // La imagen aparece al momento con una vista previa local y se sube en segundo plano.
  const insertImageFile = useCallback(async (file: File, center: XY) => {
    if (!IMAGE_TYPES.includes(file.type)) { toast.error("Formato no admitido. Usa PNG, JPG, WebP o GIF."); return; }
    const localSrc = URL.createObjectURL(file);
    const natural = await loadImageSize(localSrc);
    const box = fitImageBox(natural);
    const id = crypto.randomUUID();
    addNode("IMAGE", center, { id, width: box.width, height: box.height, media: { src: localSrc, naturalWidth: natural?.width, naturalHeight: natural?.height } });
    patchNodeData(id, (n) => (n.type === "IMAGE" ? { ...n, data: { ...n.data, uploading: true } } : n));

    try {
      const body = new FormData();
      body.append("file", await prepareImageForUpload(file, natural));
      const response = await fetch("/api/mind-map/images", { method: "POST", body });
      const result = (await response.json().catch(() => null)) as { src?: string; path?: string; error?: string } | null;
      if (!response.ok || !result?.src) throw new Error(result?.error ?? "No se pudo subir la imagen");
      patchNodeData(id, (n) => (n.type === "IMAGE" ? { ...n, data: { media: { src: result.src!, path: result.path, naturalWidth: natural?.width, naturalHeight: natural?.height } } } : n));
      markDirty();
    } catch (error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.error(error instanceof Error ? error.message : "No se pudo subir la imagen");
    } finally {
      // Se espera a que el <img> cargue la URL definitiva antes de soltar la local.
      setTimeout(() => URL.revokeObjectURL(localSrc), 10_000);
    }
  }, [addNode, patchNodeData, setNodes, markDirty]);

  const insertImageFiles = useCallback((files: File[], center: XY) => {
    files.forEach((file, index) => void insertImageFile(file, { x: center.x + index * 32, y: center.y + index * 32 }));
  }, [insertImageFile]);

  // Tarjeta de enlace: se crea con la dirección y se completa con la vista
  // previa. Si la dirección es directamente una imagen, pasa a ser un nodo Imagen.
  const insertLink = useCallback(async (rawUrl: string, center: XY) => {
    const url = pastedUrl(rawUrl) ?? pastedUrl(`https://${rawUrl.trim().replace(/^\/+/, "")}`);
    if (!url) { toast.error("Ese enlace no es válido"); return; }
    const id = crypto.randomUUID();
    addNode("LINK", center, { id, media: { url } });
    patchNodeData(id, (n) => (n.type === "LINK" ? { ...n, data: { ...n.data, loading: true } } : n));

    const preview = await getLinkPreview(url).catch(() => null);
    if (preview?.kind === "image") {
      const box = fitImageBox(await loadImageSize(preview.url));
      patchNodeData(id, (n) => toFlowNode({ ...fromFlowNode(n), kind: "IMAGE", width: box.width, height: box.height, media: { src: preview.url } }));
    } else {
      const media = preview?.kind === "link" ? preview.media : { url };
      // Sin miniatura la tarjeta se queda en una franja compacta.
      const height = media.image ? DEFAULT_NODE_SIZE.LINK.height : 84;
      patchNodeData(id, (n) => (n.type === "LINK" ? { ...n, height, data: { media } } : n));
    }
    markDirty();
  }, [addNode, patchNodeData, markDirty]);

  const pickImages = useCallback(() => fileInputRef.current?.click(), []);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (isDrawingTool(tool) || !event.clipboardData) return;
      const files = [...event.clipboardData.files].filter((file) => IMAGE_TYPES.includes(file.type));
      if (files.length > 0) {
        event.preventDefault();
        insertImageFiles(files, pastePosition());
        return;
      }
      const url = pastedUrl(event.clipboardData.getData("text/plain"));
      if (url) {
        event.preventDefault();
        void insertLink(url, pastePosition());
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [tool, insertImageFiles, insertLink, pastePosition]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    const types = [...event.dataTransfer.types];
    if (!types.includes("Files") && !types.includes("text/uri-list")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    const position = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const files = [...event.dataTransfer.files].filter((file) => IMAGE_TYPES.includes(file.type));
    if (files.length > 0) {
      event.preventDefault();
      insertImageFiles(files, position);
      return;
    }
    const url = pastedUrl(event.dataTransfer.getData("text/uri-list").split("\n")[0] ?? "");
    if (url) {
      event.preventDefault();
      void insertLink(url, position);
    }
  }, [reactFlow, insertImageFiles, insertLink]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    setEdges((eds) => [...eds, toFlowEdge({ id: crypto.randomUUID(), sourceId: connection.source, targetId: connection.target, sourceHandle: connection.sourceHandle ?? null, targetHandle: connection.targetHandle ?? null, label: null, style: "ARROW", options: lastEdgeOptionsRef.current })]);
    markDirty();
  }, [setEdges, markDirty]);

  const absolutePosition = useCallback((node: MindMapFlowNode): XY => reactFlow.getInternalNode(node.id)?.internals.positionAbsolute ?? node.position, [reactFlow]);

  const nodeBox = useCallback((node: MindMapFlowNode) => {
    const abs = absolutePosition(node);
    return { x: abs.x, y: abs.y, width: node.width ?? node.measured?.width ?? DEFAULT_NODE_SIZE[node.type].width, height: node.height ?? node.measured?.height ?? DEFAULT_NODE_SIZE[node.type].height };
  }, [absolutePosition]);

  // Copia de una forma o pósit (mismo tipo, forma, color y tamaño, sin texto)
  // unida con una flecha. Sin `dropAt` se coloca junto al original en la
  // dirección del conector; con `dropAt` se centra donde se soltó la conexión.
  const cloneNode = useCallback((nodeId: string, side: Position, dropAt?: XY) => {
    const source = nodesRef.current.find((n) => n.id === nodeId);
    if (!source || (source.type !== "SHAPE" && source.type !== "STICKY")) return;
    const box = nodeBox(source);
    let position: XY;
    let parentId = source.parentId;
    let targetSide = OPPOSITE_SIDE[side];
    if (dropAt) {
      position = { x: dropAt.x - box.width / 2, y: dropAt.y - box.height / 2 };
      parentId = undefined;
      targetSide = sideFacing({ ...position, width: box.width, height: box.height }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    } else {
      const dx = side === Position.Right ? box.width + CLONE_GAP : side === Position.Left ? -(box.width + CLONE_GAP) : 0;
      const dy = side === Position.Bottom ? box.height + CLONE_GAP : side === Position.Top ? -(box.height + CLONE_GAP) : 0;
      position = { x: source.position.x + dx, y: source.position.y + dy };
    }
    const clone = { ...source, id: crypto.randomUUID(), position, parentId, width: box.width, height: box.height, measured: undefined, dragging: false, selected: true, data: { ...source.data, text: "" } } as MindMapFlowNode;
    setNodes((nds) => sortNodesParentFirst([...nds.map((n) => (n.selected ? { ...n, selected: false } : n)), clone]));
    setEdges((eds) => [...eds, toFlowEdge({ id: crypto.randomUUID(), sourceId: source.id, targetId: clone.id, sourceHandle: side, targetHandle: targetSide, label: null, style: "ARROW", options: lastEdgeOptionsRef.current })]);
    markDirty();
  }, [nodeBox, setNodes, setEdges, markDirty]);

  // Soltar una conexión que no llega a ningún conector: sobre otro elemento lo
  // conecta con él; en un hueco crea ahí una copia conectada; y un clic en el
  // conector sin arrastrar crea la copia en esa dirección.
  const handleConnectEnd = useCallback<OnConnectEnd>((event, state) => {
    if (state.isValid || !state.fromNode || !state.fromHandle) return;
    const pointer = "changedTouches" in event ? event.changedTouches[0] : event;
    if (!pointer) return;
    const side = (state.fromHandle.id ?? state.fromHandle.position) as Position;
    const drop = reactFlow.screenToFlowPosition({ x: pointer.clientX, y: pointer.clientY });
    const fromNodeId = state.fromNode.id;

    if (Math.hypot(drop.x - state.from.x, drop.y - state.from.y) * reactFlow.getZoom() < 12) {
      cloneNode(fromNodeId, side);
      return;
    }

    const target = reactFlow
      .getIntersectingNodes({ x: drop.x, y: drop.y, width: 1, height: 1 })
      .reverse()
      .find((n) => n.id !== fromNodeId && n.type !== "GROUP" && n.type !== "DRAWING");
    if (target) {
      setEdges((eds) => [...eds, toFlowEdge({ id: crypto.randomUUID(), sourceId: fromNodeId, targetId: target.id, sourceHandle: side, targetHandle: sideFacing(nodeBox(target), state.from), label: null, style: "ARROW", options: lastEdgeOptionsRef.current })]);
      markDirty();
      return;
    }
    cloneNode(fromNodeId, side, drop);
  }, [reactFlow, cloneNode, nodeBox, setEdges, markDirty]);

  // ── Arrastre: reagrupado dentro/fuera de un Grupo ────────────────────────
  // Los grupos también se pueden anidar. Al mover uno conserva todos sus
  // hijos, y `canReparentNodeToGroup` evita ciclos como A > B > A.
  const reparentAfterDrag = useCallback((draggedNode: MindMapFlowNode) => {
    const abs = absolutePosition(draggedNode);
    const centerX = abs.x + (draggedNode.measured?.width ?? draggedNode.width ?? 200) / 2;
    const centerY = abs.y + (draggedNode.measured?.height ?? draggedNode.height ?? 120) / 2;

    const group = [...nodesRef.current].reverse().find((n) => {
      if (!canReparentNodeToGroup(nodesRef.current, draggedNode.id, n.id)) return false;
      const groupAbs = absolutePosition(n);
      return centerX >= groupAbs.x && centerX <= groupAbs.x + (n.measured?.width ?? n.width ?? 0) && centerY >= groupAbs.y && centerY <= groupAbs.y + (n.measured?.height ?? n.height ?? 0);
    });

    const newParentId = group?.id;
    if (newParentId === draggedNode.parentId) return;
    const groupAbs = group ? absolutePosition(group) : { x: 0, y: 0 };
    const position = { x: abs.x - groupAbs.x, y: abs.y - groupAbs.y };
    setNodes((nds) => sortNodesParentFirst(nds.map((n) => (n.id === draggedNode.id ? { ...n, parentId: newParentId, position } : n))));
  }, [absolutePosition, setNodes]);

  const handleNodeDragStart = useCallback((_event: MouseEvent | TouchEvent, _node: MindMapFlowNode, draggedNodes: MindMapFlowNode[]) => {
    dragStartRef.current = new Map(draggedNodes.map((n) => [n.id, { ...n.position }]));
  }, []);

  const handleNodeDragStop = useCallback((_event: MouseEvent | TouchEvent, _node: MindMapFlowNode, draggedNodes: MindMapFlowNode[]) => {
    const moved = draggedNodes.some((n) => {
      const start = dragStartRef.current.get(n.id);
      return !start || start.x !== n.position.x || start.y !== n.position.y;
    });
    if (!moved) return;
    for (const node of draggedNodes) reparentAfterDrag(node);
    markDirty();
  }, [reparentAfterDrag, markDirty]);

  // ── Borrado local con Deshacer ───────────────────────────────────────────
  const deleteNodes = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    const deletedNodes = nodesRef.current.filter((n) => idSet.has(n.id));
    if (deletedNodes.length === 0) return;
    const deletedEdges = edgesRef.current.filter((e) => idSet.has(e.source) || idSet.has(e.target));
    const absoluteById = new Map(deletedNodes.map((n) => [n.id, absolutePosition(n)]));
    // Los hijos de un grupo borrado que no se borran pasan a nivel superior con su posición absoluta.
    const survivors = new Map(
      nodesRef.current
        .filter((n) => n.parentId && idSet.has(n.parentId) && !idSet.has(n.id))
        .map((n) => [n.id, { parentId: n.parentId!, position: n.position, absolute: absolutePosition(n) }]),
    );

    setNodes((nds) => sortNodesParentFirst(nds.filter((n) => !idSet.has(n.id)).map((n) => {
      const survivor = survivors.get(n.id);
      return survivor ? { ...n, parentId: undefined, position: survivor.absolute } : n;
    })));
    setEdges((eds) => eds.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)));
    markDirty();

    toast(deletedNodes.length === 1 ? "Elemento eliminado" : `${deletedNodes.length} elementos eliminados`, {
      action: {
        label: "Deshacer",
        onClick: () => {
          setNodes((nds) => {
            const present = new Set(nds.map((n) => n.id));
            const willExist = (id?: string) => Boolean(id && (present.has(id) || idSet.has(id)));
            const restoredSurvivors = nds.map((n) => {
              const survivor = survivors.get(n.id);
              return survivor && n.parentId === undefined && willExist(survivor.parentId) ? { ...n, parentId: survivor.parentId, position: survivor.position } : n;
            });
            const readded = deletedNodes
              .filter((n) => !present.has(n.id))
              .map((n) => (!n.parentId || willExist(n.parentId) ? { ...n, selected: false } : { ...n, selected: false, parentId: undefined, position: absoluteById.get(n.id)! }));
            return sortNodesParentFirst([...restoredSurvivors, ...readded]);
          });
          setEdges((eds) => {
            const present = new Set(eds.map((e) => e.id));
            return [...eds, ...deletedEdges.filter((e) => !present.has(e.id)).map((e) => ({ ...e, selected: false }))];
          });
          markDirty();
        },
      },
    });
  }, [absolutePosition, setNodes, setEdges, markDirty]);

  const deleteEdges = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    const deleted = edgesRef.current.filter((e) => idSet.has(e.id));
    if (deleted.length === 0) return;
    setEdges((eds) => eds.filter((e) => !idSet.has(e.id)));
    markDirty();
    toast(deleted.length === 1 ? "Conexión eliminada" : `${deleted.length} conexiones eliminadas`, {
      action: {
        label: "Deshacer",
        onClick: () => {
          setEdges((eds) => {
            const present = new Set(eds.map((e) => e.id));
            return [...eds, ...deleted.filter((e) => !present.has(e.id)).map((e) => ({ ...e, selected: false }))];
          });
          markDirty();
        },
      },
    });
  }, [setEdges, markDirty]);

  // ── Dibujo a mano alzada y goma ──────────────────────────────────────────
  const drawingTool: DrawingTool | null = tool === "pen" || tool === "highlighter" ? tool : null;

  const handleStroke = useCallback((points: Point[]) => {
    if (!drawingTool) return;
    const settings = drawSettings[drawingTool];
    const box = strokeToNodeBox(points, settings.width);
    const node = toFlowNode({
      id: crypto.randomUUID(),
      kind: "DRAWING",
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      parentId: null,
      text: null,
      color: settings.color,
      clinicId: null,
      competitorId: null,
      contentItemId: null,
      style: { tool: drawingTool, strokeWidth: settings.width, baseWidth: box.width, baseHeight: box.height },
      points: box.points,
      media: null,
    });
    setNodes((nds) => [...nds, node]);
    markDirty();
  }, [drawingTool, drawSettings, setNodes, markDirty]);

  const handleErase = useCallback((point: Point, radius: number) => {
    let changed = false;
    for (const node of nodesRef.current) {
      if (node.type !== "DRAWING" || erasingRef.current.has(node.id)) continue;
      const box = nodeBox(node);
      const strokeWidth = node.data.style.strokeWidth ?? 4;
      const reach = radius + strokeWidth;
      if (point[0] < box.x - reach || point[0] > box.x + box.width + reach || point[1] < box.y - reach || point[1] > box.y + box.height + reach) continue;
      const sx = box.width / (node.data.style.baseWidth ?? box.width);
      const sy = box.height / (node.data.style.baseHeight ?? box.height);
      if (strokeHitsPoint({ x: box.x, y: box.y, sx, sy, points: node.data.points, strokeWidth }, point, radius)) {
        erasingRef.current.add(node.id);
        changed = true;
      }
    }
    if (changed) setErasingIds(new Set(erasingRef.current));
  }, [nodeBox]);

  const handleEraseEnd = useCallback(() => {
    const ids = [...erasingRef.current];
    erasingRef.current = new Set();
    setErasingIds(new Set());
    if (ids.length > 0) deleteNodes(ids);
  }, [deleteNodes]);

  const handleTableCreate = useCallback((box: TableBox) => {
    const width = box.cols * TABLE_CELL_WIDTH;
    const height = box.rows * TABLE_CELL_HEIGHT;
    const cells = Array.from({ length: box.rows }, () => Array.from({ length: box.cols }, () => ""));
    addNode("TABLE", { x: box.x + width / 2, y: box.y + height / 2 }, { width, height, media: { cells, header: false } });
    setTool("select");
  }, [addNode]);

  const tableTool = useTableTool({ active: tool === "table", onCreate: handleTableCreate });

  const { previewRef, onPointerDownCapture } = useFreehand({
    mode: tool === "eraser" ? "erase" : drawingTool ? "draw" : null,
    strokeWidth: drawingTool ? drawSettings[drawingTool].width : 0,
    onStroke: handleStroke,
    onErase: handleErase,
    onEraseEnd: handleEraseEnd,
  });

  const selectTool = useCallback((next: CanvasTool) => {
    setTool(next);
    if (!isDrawingTool(next)) return;
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
    setEdges((eds) => eds.map((e) => (e.selected ? { ...e, selected: false } : e)));
  }, [setNodes, setEdges]);

  // ── Teclado ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirtyRef.current) void save();
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        const key = event.key.toLowerCase();
        if (TOOL_SHORTCUTS[key]) { selectTool(TOOL_SHORTCUTS[key]); return; }
        if (key === "s") { selectTool("sticky"); return; }
        if (key === "r") { addShape("rectangle"); return; }
        if (key === "o") { addShape("ellipse"); return; }
        if (key === "f") { toggleFullscreen(); return; }
        if (key === "i") { pickImages(); return; }
      }
      const selectedNodes = nodesRef.current.filter((n) => n.selected);
      if (event.key === "Enter" && selectedNodes.length === 1 && (selectedNodes[0].type === "SHAPE" || selectedNodes[0].type === "STICKY")) {
        event.preventDefault();
        setEditRequest({ nodeId: selectedNodes[0].id, nonce: Date.now() });
        return;
      }
      if (event.key === "Escape") {
        const selectedEdges = edgesRef.current.some((e) => e.selected);
        if (tool !== "select" && tool !== "hand") setTool("select");
        else if (selectedNodes.length > 0 || selectedEdges) {
          setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
          setEdges((eds) => eds.map((e) => (e.selected ? { ...e, selected: false } : e)));
        } else if (fullscreen) toggleFullscreen();
        return;
      }
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const selectedEdgeIds = edgesRef.current.filter((e) => e.selected).map((e) => e.id);
      if (selectedNodes.length === 0 && selectedEdgeIds.length === 0) return;
      event.preventDefault();
      if (selectedNodes.length > 0) deleteNodes(selectedNodes.map((n) => n.id));
      else deleteEdges(selectedEdgeIds);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save, deleteNodes, deleteEdges, setNodes, setEdges, selectTool, addShape, toggleFullscreen, pickImages, tool, fullscreen]);

  // ── Vista y exportación ──────────────────────────────────────────────────
  const handleFitView = useCallback(() => { void reactFlow.fitView({ padding: 0.2, duration: 300 }); }, [reactFlow]);
  const handleNavigateToGroup = useCallback((groupId: string) => {
    void reactFlow.fitView({ nodes: [{ id: groupId }], padding: 0.08, duration: 450, maxZoom: 1 });
  }, [reactFlow]);

  const handleExportPng = useCallback(async () => {
    if (nodesRef.current.length === 0) { toast.info("El mapa está vacío"); return; }
    setExporting(true);
    try {
      const bounds = getNodesBounds(nodesRef.current);
      const width = Math.max(Math.ceil(bounds.width) + 120, 480);
      const height = Math.max(Math.ceil(bounds.height) + 120, 360);
      const viewport = getViewportForBounds(bounds, width, height, 0.1, 2, 0.08);
      const viewportEl = wrapperRef.current?.querySelector<HTMLElement>(".react-flow__viewport");
      if (!viewportEl) throw new Error("No se encontró el lienzo");
      const dataUrl = await toPng(viewportEl, {
        // El fondo del tema activo del lienzo, no el de la app.
        backgroundColor: getComputedStyle(wrapperRef.current ?? document.documentElement).getPropertyValue("--bg").trim(),
        imagePlaceholder: TRANSPARENT_PIXEL,
        filter: (element) => !(element instanceof HTMLIFrameElement),
        width,
        height,
        style: { width: `${width}px`, height: `${height}px`, transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` },
      });
      const link = document.createElement("a");
      link.download = `${mapName || "mapa-mental"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("No se pudo exportar el mapa");
    } finally {
      setExporting(false);
    }
  }, [mapName]);

  const contextValue = useMemo<MindMapContextValue>(() => ({
    records,
    updateNodeText,
    updateEdgeLabel,
    updateEdgeOptions,
    swapEdgeDirection,
    labelEditRequest,
    resizeNode,
    updateTable,
    openConvertDialog,
    cloneNode,
    editRequest,
    clearEditRequest,
    editorSessionRef,
    erasingIds,
    themeClass,
  }), [records, updateNodeText, updateEdgeLabel, updateEdgeOptions, swapEdgeDirection, labelEditRequest, resizeNode, updateTable, openConvertDialog, cloneNode, editRequest, clearEditRequest, erasingIds, themeClass]);

  const formatNodes = nodes.filter((n): n is StyledFlowNode => Boolean(n.selected) && isStyled(n));
  const draggingNodes = nodes.some((n) => n.dragging);
  const previewSettings = drawingTool ? drawSettings[drawingTool] : null;

  return (
    <MindMapProvider value={contextValue}>
      <div
        ref={wrapperRef}
        className={`mindmap-canvas w-full overflow-hidden bg-bg ${fullscreen ? "fixed inset-0 z-[45] h-dvh" : "relative h-[calc(100vh-220px)] min-h-[520px] rounded-xl border border-border"} ${tool === "select" ? "mindmap-tool-select" : ""} ${tool === "sticky" ? "mindmap-tool-sticky" : ""} ${tool === "table" ? "mindmap-tool-table" : ""} ${isDrawingTool(tool) ? "mindmap-tool-draw" : ""} ${themeClass}`}
        onDoubleClick={handlePaneDoubleClick}
        onPointerDownCapture={(event) => { tableTool.onPointerDownCapture(event); onPointerDownCapture(event); }}
        onPointerMove={(event) => { lastPointerRef.current = { x: event.clientX, y: event.clientY }; }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        // Evita el autodesplazamiento del navegador al pulsar la rueda central.
        onMouseDown={(event) => { if (event.button === 1) event.preventDefault(); }}
      >
        {/*
          Interacción tipo Figma: con Seleccionar, arrastrar con el botón
          izquierdo dibuja un recuadro de selección y el lienzo se mueve con la
          rueda central pulsada (o manteniendo Espacio). Con Mano, el botón
          izquierdo mueve el lienzo. Con lápiz, subrayador o goma, el botón
          izquierdo dibuja o borra trazos. La rueda desplaza; Cmd/Ctrl + rueda o
          el pellizco hacen zoom.
        */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onConnectEnd={handleConnectEnd}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
          onNodeDoubleClick={handleNodeDoubleClick}
          onPaneClick={handlePaneClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          onReconnect={handleReconnect}
          edgesReconnectable={!isDrawingTool(tool)}
          reconnectRadius={14}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ strokeWidth: 1.5 }}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={40}
          connectOnClick={false}
          deleteKeyCode={null}
          nodesDraggable={!isDrawingTool(tool)}
          nodesConnectable={!isDrawingTool(tool)}
          elementsSelectable={!isDrawingTool(tool)}
          panOnDrag={tool === "hand" ? true : [1]}
          selectionOnDrag={tool === "select"}
          selectionMode={SelectionMode.Partial}
          selectionKeyCode={null}
          multiSelectionKeyCode={["Shift", "Meta", "Control"]}
          panOnScroll
          zoomOnDoubleClick={false}
          minZoom={0.1}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} color="var(--mindmap-dots, var(--border))" gap={24} size={1.5} />
          <Controls showInteractive={false} className="!border !border-border !bg-surface !shadow-lg [&_button]:!border-border [&_button]:!bg-surface [&_button]:!text-text-muted [&_button:hover]:!bg-surface-raised" />
          <MiniMap pannable zoomable className="!border !border-border !bg-surface" maskColor="color-mix(in srgb, var(--bg) 60%, transparent)" />
          <FormatToolbar
            nodes={formatNodes}
            visible={formatNodes.length > 0 && !draggingNodes}
            editorSessionRef={editorSessionRef}
            onStyleChange={updateSelectedStyle}
            onColorChange={updateSelectedColor}
            onTextFormat={applyTextFormat}
          />
        </ReactFlow>

        <GroupNavigator nodes={nodes} onNavigate={handleNavigateToGroup} onNavigateAll={handleFitView} />

        {tableTool.draft ? (
          <div aria-hidden className="pointer-events-none absolute z-[6]" style={{ left: tableTool.draft.left, top: tableTool.draft.top, width: tableTool.draft.width, height: tableTool.draft.height }}>
            <div className="mindmap-table-preview size-full" style={{ backgroundSize: `${tableTool.draft.cellWidth}px ${tableTool.draft.cellHeight}px` }} />
            <span className="absolute top-full left-0 mt-1.5 rounded-md bg-accent px-1.5 py-0.5 font-mono text-[11px] text-bg tabular-nums">{tableTool.draft.cols} × {tableTool.draft.rows}</span>
          </div>
        ) : null}

        <svg aria-hidden className="pointer-events-none absolute inset-0 z-[5] size-full overflow-visible">
          <path
            ref={previewRef}
            fill="none"
            stroke="var(--drawing-color)"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={drawingTool === "highlighter" ? 0.4 : 1}
            className={previewSettings ? `mindmap-drawing-stroke mindmap-tone-${previewSettings.color}` : ""}
          />
        </svg>

        <MindMapToolbar
          tool={tool}
          onToolChange={selectTool}
          drawSettings={drawSettings}
          onDrawSettingsChange={(drawing, settings) => setDrawSettings((current) => ({ ...current, [drawing]: settings }))}
          stickyColor={stickyColor}
          onStickyColorChange={setStickyColor}
          onAddNode={handleToolbarAdd}
          onAddShape={addShape}
          onPickImages={pickImages}
          onAddLink={(url) => void insertLink(url, viewportCenter())}
          onFitView={handleFitView}
          onExportPng={handleExportPng}
          exporting={exporting}
          theme={theme}
          onToggleTheme={() => writeTheme(theme === "light" ? "dark" : "light")}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
          dirty={dirty}
          saveStatus={saveStatus}
          onSave={() => void save()}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length > 0) insertImageFiles(files, viewportCenter());
        }}
      />

      <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <AlertDialogContent className="border-border bg-surface-raised text-text">
          <AlertDialogHeader>
            <AlertDialogTitle>Este mapa ha cambiado</AlertDialogTitle>
            <AlertDialogDescription className="text-text-muted">Alguien lo ha guardado desde que lo abriste. Puedes sobrescribirlo con tu versión o recargar la suya y perder tus cambios sin guardar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={() => setConflictOpen(false)} className="border-border bg-surface text-text">Cancelar</Button>
            <Button type="button" variant="ghost" onClick={reloadFromServer} className="text-text hover:bg-surface">Recargar</Button>
            <Button type="button" onClick={() => { setConflictOpen(false); void performSave(true); }} className="bg-accent text-bg hover:bg-accent-hover">Sobrescribir</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecordPicker kind={recordPickerKind ?? "CLIENT"} open={recordPickerKind !== null} onOpenChange={(open) => { if (!open) setRecordPickerKind(null); }} onPick={handleRecordPicked} />
      <ConvertIdeaDialog target={convertTarget} onOpenChange={(open) => { if (!open) setConvertTarget(null); }} onConverted={handleConverted} />
      {clientDetail ? (
        <ClientSheet
          client={clientDetail}
          open={clientSheetTarget !== null}
          onOpenChange={(open) => { if (!open) setClientSheetTarget(null); }}
          onSaved={() => { setClientSheetTarget(null); void refreshRecords(); }}
          onDeleted={() => { setClientSheetTarget(null); void refreshRecords(); }}
        />
      ) : null}
    </MindMapProvider>
  );
}

export function MindMapCanvas(props: {
  mapId: string;
  mapName: string;
  initialNodes: MindMapFlowNode[];
  initialEdges: MindMapFlowEdge[];
  initialRecords: MindMapRecords;
  initialMapUpdatedAt: string;
}) {
  return (
    <ReactFlowProvider>
      <MindMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
