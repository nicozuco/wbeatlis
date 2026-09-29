import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { ANCHORED_HEADING_DEPTH, createHeadingSlugger, headingTimestamp } from "./formation-content";

type MdNode = { type: string; value?: string; depth?: number; children?: MdNode[] };

export type MarkdownSection = {
  level: number;
  heading: string | null;
  anchor: string | null;
  timestamp: string | null;
  text: string;
};

const BLOCK_CONTAINERS = new Set(["root", "list", "listItem", "blockquote", "table", "footnoteDefinition"]);

// Texto plano de un nodo mdast, con saltos entre bloques y celdas separadas.
export function plainText(node: MdNode): string {
  if (node.type === "text" || node.type === "inlineCode" || node.type === "code") return node.value ?? "";
  if (node.type === "break") return "\n";
  if (!node.children) return "";
  if (node.type === "tableRow") return node.children.map(plainText).join(" | ");
  return node.children.map(plainText).join(BLOCK_CONTAINERS.has(node.type) ? "\n" : "");
}

function tidy(text: string) {
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function stripFrontmatter(markdown: string) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { body: markdown, data: {} as Record<string, string> };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([\w-]+):\s*(.*)$/);
    if (pair) data[pair[1]] = pair[2].trim().replace(/^["']|["']$/g, "");
  }
  return { body: markdown.slice(match[0].length), data };
}

export function parseMarkdown(markdown: string) {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdNode;
}

export function firstHeading(markdown: string) {
  const tree = parseMarkdown(markdown);
  const heading = tree.children?.find((node) => node.type === "heading" && node.depth === 1);
  return heading ? plainText(heading).trim() : null;
}

// Divide un documento en apartados por encabezados h1–h3. Los h4 reciben ancla
// (igual que en la vista) pero su contenido queda dentro del apartado padre.
export function splitMarkdownSections(markdown: string): MarkdownSection[] {
  const tree = parseMarkdown(markdown);
  const slug = createHeadingSlugger();
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection & { parts: string[] } = { level: 0, heading: null, anchor: null, timestamp: null, text: "", parts: [] };
  const flush = () => {
    const text = tidy(current.parts.join("\n\n"));
    if (text || current.heading) sections.push({ level: current.level, heading: current.heading, anchor: current.anchor, timestamp: current.timestamp, text });
  };
  for (const node of tree.children ?? []) {
    if (node.type === "heading" && (node.depth ?? 9) <= ANCHORED_HEADING_DEPTH) {
      const heading = plainText(node).trim();
      const anchor = slug(heading);
      if ((node.depth ?? 9) <= 3) {
        flush();
        current = { level: node.depth ?? 1, heading, anchor, timestamp: headingTimestamp(heading), text: "", parts: [] };
        continue;
      }
      current.parts.push(heading);
      continue;
    }
    if (node.type === "html") continue;
    current.parts.push(plainText(node));
  }
  flush();
  return sections;
}

export function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}
