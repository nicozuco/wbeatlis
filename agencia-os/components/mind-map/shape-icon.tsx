import type { ShapeKind } from "@/lib/mind-map-style";

import { shapePath } from "./geometry";

// Icono de cada forma dibujado con la misma geometría que el nodo.
export function ShapeIcon({ shape, size = 18 }: { shape: ShapeKind; size?: number }) {
  const inner = size - 3;
  const { outline, detail } = shapePath(shape, inner, shape === "ellipse" || shape === "parallelogram" || shape === "hexagon" ? inner * 0.72 : inner);
  const offsetY = shape === "ellipse" || shape === "parallelogram" || shape === "hexagon" ? (inner * 0.28) / 2 : 0;
  return (
    <svg aria-hidden width={size} height={size} viewBox={`-1.5 ${-1.5 - offsetY} ${size} ${size}`} className="shrink-0">
      <path d={outline} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      {detail ? <path d={detail} fill="none" stroke="currentColor" strokeWidth={1.5} /> : null}
    </svg>
  );
}
