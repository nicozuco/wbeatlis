import type { ShapeKind } from "@/lib/mind-map-style";

export type Point = [number, number];

const r = (value: number) => Math.round(value * 100) / 100;

// Contorno de cada forma en píxeles reales del nodo (no en un viewBox escalado)
// para que el grosor y el discontinuo del borde no se deformen al redimensionar.
// `detail` es un trazo extra sin relleno (la boca del cilindro).
export function shapePath(shape: ShapeKind, width: number, height: number): { outline: string; detail?: string } {
  const w = r(width);
  const h = r(height);
  switch (shape) {
    case "rectangle":
      return { outline: `M0 0H${w}V${h}H0Z` };
    case "rounded": {
      const c = r(Math.min(4, w / 4, h / 4));
      return { outline: `M${c} 0H${r(w - c)}A${c} ${c} 0 0 1 ${w} ${c}V${r(h - c)}A${c} ${c} 0 0 1 ${r(w - c)} ${h}H${c}A${c} ${c} 0 0 1 0 ${r(h - c)}V${c}A${c} ${c} 0 0 1 ${c} 0Z` };
    }
    case "ellipse":
      return { outline: `M0 ${r(h / 2)}A${r(w / 2)} ${r(h / 2)} 0 1 0 ${w} ${r(h / 2)}A${r(w / 2)} ${r(h / 2)} 0 1 0 0 ${r(h / 2)}Z` };
    case "diamond":
      return { outline: `M${r(w / 2)} 0L${w} ${r(h / 2)}L${r(w / 2)} ${h}L0 ${r(h / 2)}Z` };
    case "triangle":
      return { outline: `M${r(w / 2)} 0L${w} ${h}H0Z` };
    case "triangleDown":
      return { outline: `M0 0H${w}L${r(w / 2)} ${h}Z` };
    case "parallelogram": {
      const o = r(w * 0.18);
      return { outline: `M${o} 0H${w}L${r(w - o)} ${h}H0Z` };
    }
    case "hexagon": {
      const o = r(Math.min(w * 0.2, h * 0.5));
      return { outline: `M${o} 0H${r(w - o)}L${w} ${r(h / 2)}L${r(w - o)} ${h}H${o}L0 ${r(h / 2)}Z` };
    }
    case "cylinder": {
      const ry = r(Math.min(h * 0.12, 20, h / 2));
      return {
        outline: `M0 ${ry}A${r(w / 2)} ${ry} 0 0 1 ${w} ${ry}V${r(h - ry)}A${r(w / 2)} ${ry} 0 0 1 0 ${r(h - ry)}Z`,
        detail: `M0 ${ry}A${r(w / 2)} ${ry} 0 0 0 ${w} ${ry}`,
      };
    }
  }
}

// Margen interior del texto para que quede dentro de la silueta de cada forma.
export function shapeTextInset(shape: ShapeKind, width: number, height: number): string {
  const px = (top: number, right: number, bottom: number, left: number) => `${r(top)}px ${r(right)}px ${r(bottom)}px ${r(left)}px`;
  switch (shape) {
    case "ellipse":
      return px(height * 0.15, width * 0.15, height * 0.15, width * 0.15);
    case "diamond":
      return px(height * 0.22, width * 0.22, height * 0.22, width * 0.22);
    case "triangle":
      return px(height * 0.42, width * 0.2, height * 0.08, width * 0.2);
    case "triangleDown":
      return px(height * 0.08, width * 0.2, height * 0.42, width * 0.2);
    case "parallelogram":
    case "hexagon":
      return px(10, width * 0.2, 10, width * 0.2);
    case "cylinder": {
      const ry = Math.min(height * 0.12, 20, height / 2);
      return px(ry * 2 + 6, 14, ry + 6, 14);
    }
    default:
      return px(10, 14, 10, 14);
  }
}

// Trazo suavizado con curvas cuadráticas entre los puntos medios. sx/sy escalan
// los puntos cuando el dibujo se ha redimensionado.
export function smoothPath(points: Point[], sx = 1, sy = 1): string {
  if (points.length === 0) return "";
  const p = points.map(([x, y]) => [r(x * sx), r(y * sy)] as Point);
  if (p.length === 1) return `M${p[0][0]} ${p[0][1]}l0.01 0`;
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i += 1) {
    const [x, y] = p[i];
    const [nx, ny] = p[i + 1];
    d += `Q${x} ${y} ${r((x + nx) / 2)} ${r((y + ny) / 2)}`;
  }
  const last = p[p.length - 1];
  return `${d}L${last[0]} ${last[1]}`;
}

function distanceToSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// ¿Pasa la goma (punto + radio, en coordenadas del lienzo) por encima del trazo?
export function strokeHitsPoint(stroke: { x: number; y: number; sx: number; sy: number; points: Point[]; strokeWidth: number }, point: Point, radius: number) {
  const reach = radius + stroke.strokeWidth / 2;
  const absolute = stroke.points.map(([x, y]) => [stroke.x + x * stroke.sx, stroke.y + y * stroke.sy] as Point);
  if (absolute.length === 1) return Math.hypot(point[0] - absolute[0][0], point[1] - absolute[0][1]) <= reach;
  for (let i = 1; i < absolute.length; i += 1) {
    if (distanceToSegment(point, absolute[i - 1], absolute[i]) <= reach) return true;
  }
  return false;
}

// Convierte los puntos de un trazo (coordenadas del lienzo) en la caja del nodo
// Dibujo y los puntos relativos a ella, con margen para el grosor del trazo.
export function strokeToNodeBox(points: Point[], strokeWidth: number) {
  const pad = strokeWidth / 2 + 2;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const width = Math.max(Math.max(...xs) + pad - minX, 1);
  const height = Math.max(Math.max(...ys) + pad - minY, 1);
  return { x: minX, y: minY, width, height, points: points.map(([x, y]) => [r(x - minX), r(y - minY)] as Point) };
}
