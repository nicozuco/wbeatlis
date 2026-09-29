"use client";

import { useCallback, useRef } from "react";
import { useReactFlow } from "@xyflow/react";

import { smoothPath, type Point } from "./geometry";

// Dibujo a mano alzada y goma sobre el lienzo. Se engancha en la fase de
// captura del contenedor: con lápiz, subrayador o goma el botón izquierdo nunca
// llega a React Flow (no selecciona ni arrastra), mientras que la rueda sigue
// haciendo zoom y la rueda central sigue moviendo el lienzo.
// El trazo en curso se pinta directamente sobre `previewRef` sin re-renderizar.
export function useFreehand({
  mode,
  strokeWidth,
  onStroke,
  onErase,
  onEraseEnd,
}: {
  mode: "draw" | "erase" | null;
  strokeWidth: number;
  onStroke: (points: Point[]) => void;
  onErase: (point: Point, radius: number) => void;
  onEraseEnd: () => void;
}) {
  const reactFlow = useReactFlow();
  const previewRef = useRef<SVGPathElement>(null);

  const onPointerDownCapture = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!mode || event.button !== 0) return;
    const target = event.target as Element;
    if (!target.closest(".react-flow__renderer") || target.closest(".react-flow__panel")) return;
    event.preventDefault();
    event.stopPropagation();

    const bounds = event.currentTarget.getBoundingClientRect();
    const zoom = reactFlow.getZoom();
    const flowPoints: Point[] = [];
    const screenPoints: Point[] = [];
    const preview = previewRef.current;
    preview?.setAttribute("stroke-width", String(strokeWidth * zoom));

    const addPoint = (clientX: number, clientY: number) => {
      const flow = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });
      const last = flowPoints[flowPoints.length - 1];
      if (last && Math.hypot(flow.x - last[0], flow.y - last[1]) < 1.5 / zoom) return;
      flowPoints.push([flow.x, flow.y]);
      if (mode === "erase") {
        onErase([flow.x, flow.y], 10 / zoom);
        return;
      }
      screenPoints.push([clientX - bounds.left, clientY - bounds.top]);
      preview?.setAttribute("d", smoothPath(screenPoints));
    };

    const handleMove = (moveEvent: PointerEvent) => {
      const events = moveEvent.getCoalescedEvents?.() ?? [];
      for (const item of events.length > 0 ? events : [moveEvent]) addPoint(item.clientX, item.clientY);
    };

    const handleEnd = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      preview?.setAttribute("d", "");
      if (mode === "erase") onEraseEnd();
      else if (flowPoints.length > 0) onStroke(flowPoints);
    };

    addPoint(event.clientX, event.clientY);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
  }, [mode, strokeWidth, reactFlow, onStroke, onErase, onEraseEnd]);

  return { previewRef, onPointerDownCapture };
}
