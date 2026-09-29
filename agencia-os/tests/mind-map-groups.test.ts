import assert from "node:assert/strict";
import test from "node:test";

import { canReparentNodeToGroup, fromFlowNode, sortNodesParentFirst } from "../components/mind-map/graph-utils";
import { buildGroupNavigationTree } from "../components/mind-map/group-navigator";
import type { GroupFlowNode, MindMapFlowNode, ShapeFlowNode } from "../components/mind-map/types";

const group = (id: string, parentId?: string): GroupFlowNode => ({
  id,
  type: "GROUP",
  position: { x: 0, y: 0 },
  parentId,
  data: { text: id, color: null },
});

const shape = (id: string, parentId?: string): ShapeFlowNode => ({
  id,
  type: "SHAPE",
  position: { x: 0, y: 0 },
  parentId,
  data: { text: "", color: "white", style: {} },
});

test("un grupo puede entrar en otro grupo y la jerarquía se ordena de padre a hijo", () => {
  const nodes: MindMapFlowNode[] = [shape("nota", "interior"), group("interior", "exterior"), group("exterior")];

  assert.equal(canReparentNodeToGroup(nodes, "interior", "exterior"), true);
  assert.deepEqual(sortNodesParentFirst(nodes).map((node) => node.id), ["exterior", "interior", "nota"]);
  assert.equal(fromFlowNode(nodes[1]).parentId, "exterior");
});

test("un grupo no puede entrar en sí mismo ni en uno de sus descendientes", () => {
  const nodes: MindMapFlowNode[] = [group("exterior"), group("interior", "exterior"), group("nieto", "interior"), shape("nota")];

  assert.equal(canReparentNodeToGroup(nodes, "exterior", "exterior"), false);
  assert.equal(canReparentNodeToGroup(nodes, "exterior", "interior"), false);
  assert.equal(canReparentNodeToGroup(nodes, "exterior", "nieto"), false);
  assert.equal(canReparentNodeToGroup(nodes, "exterior", "nota"), false);
});

test("el índice lateral refleja todos los niveles y cuenta los subgrupos", () => {
  const nodes: MindMapFlowNode[] = [
    group("raíz"),
    { ...group("martes", "raíz"), position: { x: 300, y: 100 } },
    { ...group("lunes", "raíz"), position: { x: 100, y: 100 } },
    group("ventas", "lunes"),
    group("guiones", "ventas"),
    shape("nota", "guiones"),
  ];

  const tree = buildGroupNavigationTree(nodes);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].node.id, "raíz");
  assert.equal(tree[0].descendantCount, 4);
  assert.deepEqual(tree[0].children.map((branch) => branch.node.id), ["lunes", "martes"]);
  assert.equal(tree[0].children[0].children[0].children[0].node.id, "guiones");
});
