import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FormationMarkdown } from "../components/formation/formation-markdown";
import { buildTsQuery, detectTools, findTermRanges, highlightStems, makeSnippet, parseDuration, searchTerms } from "../lib/formation-content";
import { splitMarkdownSections, stripFrontmatter } from "../lib/formation-markdown";

test("formación: la búsqueda ignora tildes, mayúsculas y signos", () => {
  assert.deepEqual(searchTerms("¿Cómo AUTOMATIZAR el WhatsApp?"), ["como", "automatizar", "el", "whatsapp"]);
  assert.equal(buildTsQuery(["precio", "setup"]), "precio:* & setup:*");
  assert.deepEqual(searchTerms("'); DROP TABLE x; --"), ["drop", "table"]);
});

test("formación: el resaltado encuentra la palabra completa aunque lleve tildes", () => {
  const text = "La automatización con n8n y la Automatización avanzada.";
  const ranges = findTermRanges(text, highlightStems(searchTerms("automatizacion")));
  assert.deepEqual(ranges.map((range) => text.slice(range.start, range.end)), ["automatización", "Automatización"]);
  assert.equal(findTermRanges("reautomatizar", ["automat"]).length, 0);
});

test("formación: el fragmento se centra en la coincidencia", () => {
  const text = `${"relleno ".repeat(80)}el traspaso a humano se configura en objetivos ${"final ".repeat(80)}`;
  const parts = makeSnippet(text, highlightStems(searchTerms("traspaso humano")));
  assert.ok(parts.some((part) => part.hit && part.text === "traspaso"));
  assert.ok(parts[0].text.startsWith("… "));
});

test("formación: las anclas del importador coinciden con los id de la vista", () => {
  const markdown = [
    "# Título",
    "Intro con **negrita**.",
    "## Pregunta 1 — Germán: WhatsApp",
    "Texto.",
    "#### Detalle",
    "Más texto.",
    "## Pregunta 1 — Germán: WhatsApp",
    "```",
    "# esto no es un encabezado",
    "```",
    "### 12:30 · Demo en `GHL`",
    "| a | b |",
    "| - | - |",
    "| 1 | 2 |",
  ].join("\n");
  const sections = splitMarkdownSections(markdown);
  const html = renderToStaticMarkup(createElement(FormationMarkdown, { markdown }));
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
  const anchors = sections.map((section) => section.anchor).filter(Boolean);
  assert.deepEqual(anchors, ["titulo", "pregunta-1-german-whatsapp", "pregunta-1-german-whatsapp-2", "12-30-demo-en-ghl"]);
  for (const anchor of anchors) assert.ok(ids.includes(anchor as string), `falta el id ${anchor}`);
  assert.equal(sections.at(-1)?.timestamp, "12:30");
  assert.ok(sections[1].text.includes("Detalle"));
  assert.ok(html.includes("<table>"));
});

test("formación: metadatos del Markdown", () => {
  const { data, body } = stripFrontmatter("---\ntitulo: 4/5/26 iniciación\nduracion: 00:22:04\n---\n# Hola");
  assert.equal(data.titulo, "4/5/26 iniciación");
  assert.equal(parseDuration(data.duracion), 1324);
  assert.equal(parseDuration("09:51"), 591);
  assert.equal(body, "# Hola");
  assert.deepEqual(detectTools("Agente en GHL", "Se conecta con n8n. Luego n8n llama a Claude."), ["GoHighLevel", "n8n"]);
});

test("formación: los bloques visuales se dibujan y los números se leen en formato español", async () => {
  const { parseChart } = await import("../components/formation/formation-visuals");
  const chart = parseChart("titulo: MRR\nunidad: €\nseries: A | B\nMes 1: 1.500 | 200\nMes 2: 12,5 | —");
  assert.equal(chart.title, "MRR");
  assert.deepEqual(chart.series, ["A", "B"]);
  assert.deepEqual(chart.rows.map((row) => row.values), [[1500, 200], [12.5, null]]);

  const markdown = ["```grafico", "titulo: Ventas", "Enero: 10", "```", "", "> **Clave:** cobra al firmar.", "", "```js", "const a = 1;", "```"].join("\n");
  const html = renderToStaticMarkup(createElement(FormationMarkdown, { markdown }));
  assert.ok(html.includes("formation-visual"), "el gráfico no se dibujó");
  assert.ok(html.includes("Ver datos en tabla"));
  assert.ok(html.includes("formation-callout"), "el aviso no se marcó");
  assert.ok(html.includes("<pre>"), "el código normal debe seguir en <pre>");
});
