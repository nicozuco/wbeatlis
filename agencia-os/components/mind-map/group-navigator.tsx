"use client";

import { useMemo, useState } from "react";
import { ChevronRight, LocateFixed, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";

import type { MindMapFlowNode } from "./types";

type GroupNode = Extract<MindMapFlowNode, { type: "GROUP" }>;

type GroupBranch = {
  node: GroupNode;
  children: GroupBranch[];
  descendantCount: number;
};

function compareGroups(a: GroupNode, b: GroupNode) {
  return a.position.y - b.position.y || a.position.x - b.position.x || a.data.text.localeCompare(b.data.text, "es");
}

export function buildGroupNavigationTree(nodes: MindMapFlowNode[]): GroupBranch[] {
  const groups = nodes.filter((node): node is GroupNode => node.type === "GROUP");
  const byId = new Map(groups.map((group) => [group.id, group]));
  const childrenByParent = new Map<string, GroupNode[]>();

  for (const group of groups) {
    if (!group.parentId || !byId.has(group.parentId)) continue;
    const siblings = childrenByParent.get(group.parentId) ?? [];
    siblings.push(group);
    childrenByParent.set(group.parentId, siblings);
  }

  const makeBranch = (group: GroupNode, path: ReadonlySet<string>): GroupBranch => {
    if (path.has(group.id)) return { node: group, children: [], descendantCount: 0 };
    const nextPath = new Set(path).add(group.id);
    const children = [...(childrenByParent.get(group.id) ?? [])].sort(compareGroups).map((child) => makeBranch(child, nextPath));
    return {
      node: group,
      children,
      descendantCount: children.reduce((total, child) => total + 1 + child.descendantCount, 0),
    };
  };

  return groups
    .filter((group) => !group.parentId || !byId.has(group.parentId))
    .sort(compareGroups)
    .map((group) => makeBranch(group, new Set()));
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

function filterBranches(branches: GroupBranch[], query: string): GroupBranch[] {
  if (!query) return branches;
  return branches.flatMap((branch) => {
    const children = filterBranches(branch.children, query);
    const ownMatch = normalizeSearch(branch.node.data.text || "Grupo").includes(query);
    return ownMatch || children.length > 0 ? [{ ...branch, children: ownMatch ? branch.children : children }] : [];
  });
}

function BranchRow({
  branch,
  depth,
  expanded,
  searching,
  onToggle,
  onNavigate,
}: {
  branch: GroupBranch;
  depth: number;
  expanded: ReadonlySet<string>;
  searching: boolean;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
}) {
  const hasChildren = branch.children.length > 0;
  const isOpen = searching || expanded.has(branch.node.id);
  const title = branch.node.data.text.trim() || "Grupo";

  return (
    <li>
      <div className="group flex min-w-0 items-center gap-0.5 rounded-md pr-1 hover:bg-surface-raised" style={{ paddingLeft: `${Math.min(depth, 8) * 14 + 4}px` }}>
        <button
          type="button"
          onClick={() => hasChildren && onToggle(branch.node.id)}
          aria-label={hasChildren ? `${isOpen ? "Cerrar" : "Abrir"} ${title}` : undefined}
          aria-hidden={!hasChildren}
          tabIndex={hasChildren ? 0 : -1}
          className={`grid size-6 shrink-0 place-items-center rounded text-text-faint transition-colors hover:text-text ${hasChildren ? "" : "invisible"}`}
        >
          <ChevronRight className={`size-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => onNavigate(branch.node.id)}
          title={title}
          className="flex min-w-0 flex-1 items-center gap-2 rounded py-1.5 text-left text-xs text-text-muted outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="truncate">{title}</span>
          {branch.descendantCount > 0 ? <span className="ml-auto shrink-0 font-mono text-[10px] text-text-faint">{branch.descendantCount}</span> : null}
          <LocateFixed className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
        </button>
      </div>
      {hasChildren && isOpen ? (
        <ul>
          {branch.children.map((child) => (
            <BranchRow key={child.node.id} branch={child} depth={depth + 1} expanded={expanded} searching={searching} onToggle={onToggle} onNavigate={onNavigate} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function GroupNavigator({ nodes, onNavigate, onNavigateAll }: { nodes: MindMapFlowNode[]; onNavigate: (id: string) => void; onNavigateAll: () => void }) {
  const tree = useMemo(() => buildGroupNavigationTree(nodes), [nodes]);
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(tree.map((branch) => branch.node.id)));
  const normalizedQuery = normalizeSearch(query);
  const visibleTree = useMemo(() => filterBranches(tree, normalizedQuery), [tree, normalizedQuery]);

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="nodrag nopan nowheel absolute top-3 left-3 z-[8] grid size-10 place-items-center rounded-lg border border-border bg-surface/95 text-text-muted shadow-lg backdrop-blur transition-colors hover:bg-surface-raised hover:text-text"
        aria-label="Abrir índice de grupos"
        title="Abrir índice de grupos"
      >
        <PanelLeftOpen className="size-4" />
      </button>
    );
  }

  return (
    <aside className="nodrag nopan nowheel absolute top-3 bottom-24 left-3 z-[8] flex w-[min(310px,calc(100%-24px))] flex-col overflow-hidden rounded-xl border border-border bg-surface/95 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3 border-b border-border px-3 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">Índice del mapa</p>
          <p className="mt-0.5 text-[11px] text-text-faint">{tree.reduce((total, branch) => total + 1 + branch.descendantCount, 0)} grupos y subgrupos</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="grid size-7 shrink-0 place-items-center rounded-md text-text-faint hover:bg-surface-raised hover:text-text" aria-label="Cerrar índice" title="Cerrar índice">
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <div className="border-b border-border p-2.5">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar un grupo…"
            className="h-8 w-full rounded-md border border-border bg-surface-raised pr-8 pl-8 text-xs text-text outline-none placeholder:text-text-faint focus:border-accent"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-1.5 grid size-5 -translate-y-1/2 place-items-center rounded text-text-faint hover:text-text" aria-label="Limpiar búsqueda">
              <X className="size-3" />
            </button>
          ) : null}
        </label>
        <button type="button" onClick={onNavigateAll} className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-accent hover:bg-accent-soft">
          <LocateFixed className="size-3.5" />
          Ver todo el mapa
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {visibleTree.length > 0 ? (
          <ul>
            {visibleTree.map((branch) => (
              <BranchRow key={branch.node.id} branch={branch} depth={0} expanded={expanded} searching={Boolean(normalizedQuery)} onToggle={toggle} onNavigate={onNavigate} />
            ))}
          </ul>
        ) : (
          <p className="px-3 py-8 text-center text-xs text-text-faint">No hay grupos con ese nombre.</p>
        )}
      </div>
    </aside>
  );
}
