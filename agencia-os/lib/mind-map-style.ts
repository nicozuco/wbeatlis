// Opciones de estilo de los nodos del mapa mental (formas, pósits y trazos).
// Se comparten entre el lienzo y la validación de saveMindMap.

export const shapeKinds = ["rectangle", "rounded", "ellipse", "diamond", "triangle", "triangleDown", "parallelogram", "hexagon", "cylinder"] as const;
export type ShapeKind = (typeof shapeKinds)[number];

export const shapeKindLabels: Record<ShapeKind, string> = {
  rectangle: "Rectángulo",
  rounded: "Rectángulo redondeado",
  ellipse: "Elipse",
  diamond: "Rombo",
  triangle: "Triángulo",
  triangleDown: "Triángulo invertido",
  parallelogram: "Paralelogramo",
  hexagon: "Hexágono",
  cylinder: "Cilindro",
};

// Pósits en el orden de FigJam. Los valores antiguos (yellow, orange, pink,
// violet, blue, green, gray) se mantienen para no romper los mapas guardados.
export const stickyTones = ["white", "gray", "red", "orange", "yellow", "green", "teal", "blue", "violet", "pink"] as const;
export type StickyTone = (typeof stickyTones)[number];

export const stickyToneLabels: Record<StickyTone, string> = {
  white: "Blanco",
  gray: "Gris",
  red: "Rojo",
  orange: "Naranja",
  yellow: "Amarillo",
  green: "Verde",
  teal: "Turquesa",
  blue: "Azul",
  violet: "Violeta",
  pink: "Rosa",
};

// Colores de formas, grupos, trazos y conexiones: los tonos de la app
// (noteTones) más blanco, naranja y rosa, en el orden de la paleta de FigJam.
export const mindMapTones = ["neutral", "danger", "orange", "warning", "success", "accent", "info", "violet", "pink", "white"] as const;
export type MindMapTone = (typeof mindMapTones)[number];

export const mindMapToneLabels: Record<MindMapTone, string> = {
  neutral: "Neutro",
  danger: "Rojo",
  orange: "Naranja",
  warning: "Amarillo",
  success: "Verde",
  accent: "Turquesa",
  info: "Azul",
  violet: "Violeta",
  pink: "Rosa",
  white: "Blanco",
};

// Tema del lienzo, independiente del resto de la app (que siempre es oscura).
export type MindMapTheme = "dark" | "light";

export const strokeStyles = ["solid", "dashed", "none"] as const;
export type StrokeStyle = (typeof strokeStyles)[number];

export const strokeStyleLabels: Record<StrokeStyle, string> = { solid: "Continuo", dashed: "Discontinuo", none: "Sin borde" };

export const fontFamilies = ["sans", "heading", "mono"] as const;
export type FontFamily = (typeof fontFamilies)[number];

export const fontFamilyLabels: Record<FontFamily, string> = { sans: "Inter", heading: "Inter Tight", mono: "JetBrains Mono" };

export const fontSizes = ["sm", "md", "lg", "xl"] as const;
export type FontSize = (typeof fontSizes)[number];

export const fontSizeLabels: Record<FontSize, string> = { sm: "Pequeño", md: "Mediano", lg: "Grande", xl: "Muy grande" };
export const fontSizePx: Record<FontSize, number> = { sm: 12, md: 14, lg: 20, xl: 28 };

export const textAligns = ["left", "center", "right"] as const;
export type TextAlign = (typeof textAligns)[number];

export const drawingTools = ["pen", "highlighter"] as const;
export type DrawingTool = (typeof drawingTools)[number];

// Grosores disponibles (en unidades del lienzo) para cada herramienta de dibujo.
export const strokeWidthsByTool: Record<DrawingTool, readonly number[]> = { pen: [2, 4, 8], highlighter: [12, 20, 32] };

export type NodeStyle = {
  shape?: ShapeKind;
  stroke?: StrokeStyle;
  font?: FontFamily;
  fontSize?: FontSize;
  align?: TextAlign;
  tool?: DrawingTool;
  strokeWidth?: number;
  // Tamaño con el que se dibujó el trazo: al redimensionarlo, los puntos se escalan desde aquí.
  baseWidth?: number;
  baseHeight?: number;
};

// ── Conexiones ───────────────────────────────────────────────────────────────
// Trazado: curva suave, codo en ángulo recto (como FigJam) o línea recta.
export const edgePaths = ["curved", "elbow", "straight"] as const;
export type EdgePath = (typeof edgePaths)[number];

export const edgePathLabels: Record<EdgePath, string> = { curved: "Curva", elbow: "En codo", straight: "Recta" };

export const edgeCaps = ["none", "arrow", "sketch", "triangle", "triangleOutline", "diamond", "dot", "circle", "bar"] as const;
export type EdgeCap = (typeof edgeCaps)[number];

export const edgeCapLabels: Record<EdgeCap, string> = {
  none: "Sin extremo",
  arrow: "Flecha abierta",
  sketch: "Flecha a mano",
  triangle: "Triángulo",
  triangleOutline: "Triángulo vacío",
  diamond: "Rombo",
  dot: "Punto",
  circle: "Círculo vacío",
  bar: "Barra",
};

export const edgeWidths = [2, 3, 5] as const;

export type EdgeOptions = {
  path?: EdgePath;
  start?: EdgeCap;
  end?: EdgeCap;
  color?: string;
  width?: number;
  dashed?: boolean;
};

// Conexión nueva: recta y con flecha abierta al final, como una flecha dibujada a mano.
export const DEFAULT_EDGE_OPTIONS: Required<Omit<EdgeOptions, "color">> & { color: string } = { path: "straight", start: "none", end: "arrow", color: "neutral", width: 2, dashed: false };

// ── Imágenes y enlaces ───────────────────────────────────────────────────────
export type ImageMedia = {
  src: string;
  // Ruta dentro del bucket mind-map-images si se subió desde el mapa (para borrarla al quitarla).
  path?: string;
  naturalWidth?: number;
  naturalHeight?: number;
};

export const linkProviders = ["youtube", "instagram", "web"] as const;
export type LinkProvider = (typeof linkProviders)[number];

export type LinkMedia = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
  provider?: LinkProvider;
  // Id del vídeo de YouTube para reproducirlo dentro de la tarjeta.
  videoId?: string;
};

// Tabla: texto plano de cada celda por filas y si la primera fila es cabecera.
export type TableMedia = {
  cells: string[][];
  header?: boolean;
};

// Límites de una tabla (también los valida saveMindMap).
export const TABLE_MAX_ROWS = 60;
export const TABLE_MAX_COLS = 20;
// Tamaño de una celda nueva en unidades del lienzo, al crear la tabla arrastrando o al añadir filas y columnas.
export const TABLE_CELL_WIDTH = 120;
export const TABLE_CELL_HEIGHT = 40;

export type NodeMedia = ImageMedia | LinkMedia | TableMedia;

export const MIND_MAP_IMAGE_BUCKET = "mind-map-images";
