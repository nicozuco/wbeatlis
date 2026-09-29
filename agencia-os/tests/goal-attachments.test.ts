import assert from "node:assert/strict";
import test from "node:test";

import { getGoalAttachmentFormat, goalAttachmentDisplayName, isGoalAttachmentSignatureValid } from "../lib/goal-attachments";

test("admite documentos e imágenes previsualizables, pero no archivos ejecutables", () => {
  assert.deepEqual(getGoalAttachmentFormat("investigación.PDF"), { extension: "pdf", contentType: "application/pdf", label: "PDF" });
  assert.deepEqual(getGoalAttachmentFormat("resumen.html")?.contentType, "text/html");
  assert.deepEqual(getGoalAttachmentFormat("notas.md")?.contentType, "text/plain");
  assert.equal(getGoalAttachmentFormat("script.js"), null);
  assert.equal(getGoalAttachmentFormat("archivo.svg"), null);
});

test("limpia el nombre y comprueba la firma de los formatos binarios", () => {
  assert.equal(goalAttachmentDisplayName("carpeta\\resumen\n2026.pdf"), "resumen2026.pdf");
  assert.equal(isGoalAttachmentSignatureValid(new TextEncoder().encode("%PDF-1.7"), "pdf"), true);
  assert.equal(isGoalAttachmentSignatureValid(new TextEncoder().encode("not a pdf"), "pdf"), false);
  assert.equal(isGoalAttachmentSignatureValid(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), "png"), true);
  assert.equal(isGoalAttachmentSignatureValid(new Uint8Array([0, 0, 0, 0]), "png"), false);
});
