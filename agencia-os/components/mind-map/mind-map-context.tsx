"use client";

import { createContext, useContext, type RefObject } from "react";
import type { Position } from "@xyflow/react";

import type { EdgeOptions, TableMedia } from "@/lib/mind-map-style";
import type { MindMapRecords } from "./types";

// Texto de una forma o pósit que se está editando: la barra de formato lo usa
// para aplicar negrita, tachado, enlaces o listas a la selección de texto.
export type EditorSession = { nodeId: string; element: HTMLElement; finish: () => void };

// Operaciones que los nodos y conexiones piden al lienzo. Todas trabajan solo
// en memoria y marcan el mapa con cambios sin guardar.
export type MindMapContextValue = {
  records: MindMapRecords;
  updateNodeText: (nodeId: string, text: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  updateEdgeOptions: (edgeId: string, patch: EdgeOptions) => void;
  swapEdgeDirection: (edgeId: string) => void;
  // Pide a una conexión que edite su etiqueta (doble clic sobre la línea).
  labelEditRequest: { edgeId: string; nonce: number } | null;
  resizeNode: (nodeId: string, params: { x: number; y: number; width: number; height: number }) => void;
  // Celdas de una tabla y, al añadir o quitar filas y columnas, su nuevo tamaño.
  updateTable: (nodeId: string, media: TableMedia, size?: { width: number; height: number }) => void;
  openConvertDialog: (nodeId: string, currentText: string) => void;
  cloneNode: (nodeId: string, side: Position) => void;
  // Pide a un nodo que entre en edición de texto (al crearlo o al pulsar Intro).
  editRequest: { nodeId: string; nonce: number } | null;
  clearEditRequest: (nodeId: string) => void;
  editorSessionRef: RefObject<EditorSession | null>;
  // Trazos que la goma tiene marcados para borrar al soltar.
  erasingIds: ReadonlySet<string>;
  // Clase del tema del lienzo para lo que se pinta fuera de él (menús y tooltips en portal).
  themeClass: string;
};

const noop = () => {};

const MindMapContext = createContext<MindMapContextValue>({
  records: { clinics: {}, competitors: {}, contentItems: {} },
  updateNodeText: noop,
  updateEdgeLabel: noop,
  updateEdgeOptions: noop,
  swapEdgeDirection: noop,
  labelEditRequest: null,
  resizeNode: noop,
  updateTable: noop,
  openConvertDialog: noop,
  cloneNode: noop,
  editRequest: null,
  clearEditRequest: noop,
  editorSessionRef: { current: null },
  erasingIds: new Set(),
  themeClass: "",
});

export const MindMapProvider = MindMapContext.Provider;

export function useMindMap() {
  return useContext(MindMapContext);
}
