import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Exportación de datos desde Ajustes → Datos. "todo" sale en JSON con las
// relaciones; el resto también en CSV (una fila por registro). El gestor de
// contraseñas se exporta sin credenciales: van cifradas y solo se leen dentro del gestor.
const datasets = {
  todo: async () => ({
    exportadoEl: new Date().toISOString(),
    clinicas: await prisma.clinic.findMany({ include: { interactions: true, stageEvents: true, processSteps: true }, orderBy: { name: "asc" } }),
    tareas: await prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
    competencia: await prisma.competitor.findMany({ orderBy: { company: "asc" } }),
    contenido: await prisma.contentItem.findMany({ orderBy: { createdAt: "asc" } }),
    finanzas: await prisma.financeEntry.findMany({ orderBy: { occurredAt: "asc" } }),
    mrrMensual: await prisma.mrrSnapshot.findMany({ orderBy: { month: "asc" } }),
    notas: await prisma.note.findMany({ include: { tags: true }, orderBy: { createdAt: "asc" } }),
    recordatorios: await prisma.reminder.findMany({ orderBy: { remindAt: "asc" } }),
    mapasMentales: await prisma.mindMap.findMany({ include: { nodes: true, edges: true }, orderBy: { createdAt: "asc" } }),
    enlacesDelGestor: await prisma.vaultItem.findMany({ select: { title: true, url: true, category: true, description: true, createdAt: true }, orderBy: [{ category: "asc" }, { title: "asc" }] }),
  }),
  clientes: () => prisma.clinic.findMany({ orderBy: { name: "asc" } }),
  competencia: () => prisma.competitor.findMany({ orderBy: { company: "asc" } }),
  tareas: () => prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
  finanzas: () => prisma.financeEntry.findMany({ orderBy: { occurredAt: "asc" } }),
  contenido: () => prisma.contentItem.findMany({ orderBy: { createdAt: "asc" } }),
  recordatorios: () => prisma.reminder.findMany({ orderBy: { remindAt: "asc" } }),
} as const;

type Dataset = keyof typeof datasets;

function toCsv(rows: Record<string, unknown>[]) {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const cell = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const text = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",;\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
  };
  // BOM para que Excel abra bien las tildes.
  return `﻿${[headers.join(","), ...rows.map((row) => headers.map((header) => cell(row[header])).join(","))].join("\r\n")}`;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const requested = params.get("datos") ?? "todo";
  if (!(requested in datasets)) return Response.json({ error: "Datos desconocidos" }, { status: 400 });
  const dataset = requested as Dataset;
  const format = params.get("formato") === "csv" && dataset !== "todo" ? "csv" : "json";

  const data = await datasets[dataset]();
  const day = new Date().toISOString().slice(0, 10);
  const body = format === "csv" ? toCsv(data as Record<string, unknown>[]) : JSON.stringify(data, null, 2);

  return new Response(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="atlis-${dataset}-${day}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
