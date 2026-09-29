import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { ANCHORED_HEADING_DEPTH, createHeadingSlugger, findTermRanges } from "@/lib/formation-content";

import { calloutTone, FormationVisual, VISUAL_LANGUAGES } from "./formation-visuals";

type HastNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HastNode[] };

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

// Mismas anclas que calcula el importador: solo encabezados h1–h4 de primer nivel.
function rehypeHeadingAnchors() {
  return (tree: HastNode) => {
    const slug = createHeadingSlugger();
    for (const node of tree.children ?? []) {
      const depth = node.type === "element" ? Number(node.tagName?.match(/^h([1-6])$/)?.[1] ?? 0) : 0;
      if (depth && depth <= ANCHORED_HEADING_DEPTH) node.properties = { ...node.properties, id: slug(textOf(node)) };
    }
  };
}

function rehypeHighlight(stems: string[]) {
  return () => (tree: HastNode) => {
    if (!stems.length) return;
    const walk = (node: HastNode) => {
      if (!node.children || node.tagName === "code" || node.tagName === "pre") return;
      node.children = node.children.flatMap((child) => {
        if (child.type !== "text" || !child.value) {
          walk(child);
          return [child];
        }
        const ranges = findTermRanges(child.value, stems);
        if (!ranges.length) return [child];
        const pieces: HastNode[] = [];
        let cursor = 0;
        for (const range of ranges) {
          if (range.start > cursor) pieces.push({ type: "text", value: child.value.slice(cursor, range.start) });
          pieces.push({ type: "element", tagName: "mark", properties: {}, children: [{ type: "text", value: child.value.slice(range.start, range.end) }] });
          cursor = range.end;
        }
        if (cursor < child.value.length) pieces.push({ type: "text", value: child.value.slice(cursor) });
        return pieces;
      });
    };
    walk(tree);
  };
}

export type LinkContext = {
  lessonHref?: (tab: string) => string;
  courseHref?: string;
  documentHref?: (name: string) => string | null;
};

const TAB_BY_FILE: Record<string, string> = {
  "apuntes.md": "apuntes",
  "clase.md": "apuntes",
  "transcripcion.md": "transcripcion",
  "transcripcion-parcial.md": "transcripcion",
  "visuales.md": "visuales",
  "estado.md": "estado",
};

// Los archivos enlazan entre sí con rutas relativas del archivo local; en la app
// se convierten en pestañas, la página del curso o el documento. El resto
// (capturas en bruto, JSON) no se publica y se muestra como texto.
function resolveHref(href: string | undefined, context: LinkContext) {
  if (!href) return null;
  if (/^(https?:|mailto:)/i.test(href)) return { href, external: true };
  if (href.startsWith("#") || href.startsWith("/formacion")) return { href, external: false };
  const file = href.split(/[?#]/)[0];
  const name = file.split("/").pop() ?? "";
  if (TAB_BY_FILE[name] && context.lessonHref) return { href: context.lessonHref(TAB_BY_FILE[name]), external: false };
  if (name === "README.md" && context.courseHref) return { href: context.courseHref, external: false };
  if (file.includes("documentos/") && context.documentHref) {
    const documentHref = context.documentHref(decodeURIComponent(name));
    if (documentHref) return { href: documentHref, external: true };
  }
  return null;
}

export function FormationMarkdown({ markdown, highlight = [], links = {} }: { markdown: string; highlight?: string[]; links?: LinkContext }) {
  const components: Components = {
    a: ({ href, children }) => {
      const resolved = resolveHref(href, links);
      if (!resolved) return <span className="text-text">{children}</span>;
      return resolved.external
        ? <a href={resolved.href} target="_blank" rel="noopener noreferrer">{children}</a>
        : <a href={resolved.href}>{children}</a>;
    },
    img: ({ alt }) => (alt ? <span className="text-text-faint">[{alt}]</span> : null),
    pre: ({ node, children }) => {
      const code = (node as HastNode | undefined)?.children?.find((child) => child.tagName === "code");
      const classes = code?.properties?.className;
      const language = (Array.isArray(classes) ? classes : []).map(String).find((name) => name.startsWith("language-"))?.slice(9);
      if (code && language && VISUAL_LANGUAGES.has(language)) return <FormationVisual language={language} source={textOf(code)} />;
      return <pre>{children}</pre>;
    },
    blockquote: ({ node, children }) => {
      const tone = calloutTone(textOf(node as HastNode));
      return <blockquote className={tone ? `formation-callout ${tone}` : undefined}>{children}</blockquote>;
    },
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-border">
        <table>{children}</table>
      </div>
    ),
  };
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHeadingAnchors, rehypeHighlight(highlight)]} components={components}>
      {markdown}
    </ReactMarkdown>
  );
}
