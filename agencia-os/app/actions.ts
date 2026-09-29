"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { pushConfigured, sendPushToAll } from "@/lib/push";
import { fetchLinkPreview } from "@/lib/link-preview";
import { drawingTools, edgeCaps, edgePaths, fontFamilies, fontSizes, linkProviders, MIND_MAP_IMAGE_BUCKET, shapeKinds, strokeStyles, TABLE_MAX_COLS, TABLE_MAX_ROWS, textAligns } from "@/lib/mind-map-style";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRichText } from "@/lib/rich-text";
import { isAccountEmpty } from "@/lib/vault-crypto";
import { openVaultAccounts, sealVaultAccounts } from "@/lib/vault-server";
import type { ClientData } from "@/components/clients/clients-workspace";
import { assertAuthenticatedUser } from "@/lib/auth";
import { recordMrrSnapshot } from "@/lib/mrr";
import { gatePhases, phaseGuides } from "@/lib/client-process";
import { hasGoalStepField } from "@/lib/goal-step-fields";
import { pipelinePhases } from "@/lib/domain";
import { expenseFrequencies, expensePayers } from "@/lib/finance";
import { navigationHrefs } from "@/lib/navigation";
import { APPEARANCE_COOKIE, APPEARANCE_COOKIE_MAX_AGE, accents, serializeAppearance, textSizes, themes } from "@/lib/preferences";
import { lockClinic, transitionClinic } from "@/lib/process-store";

const optionalText = z.string().trim().optional().nullable();

const clinicSchema = z.object({
  id: z.string().optional(),
  expectedPhase: z.enum(pipelinePhases).optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  city: optionalText,
  contactName: optionalText,
  phone: optionalText,
  email: z.union([z.string().trim().email(), z.literal(""), z.null(), z.undefined()]),
  instagram: optionalText,
  website: optionalText,
  phase: z.enum(pipelinePhases),
  leadSource: optionalText,
  firstContactAt: optionalText,
  nextFollowUpAt: optionalText,
  monthlyFee: z.union([z.string(), z.number()]).optional(),
});

const parseDate = (value: string | null | undefined) => (value ? new Date(`${value}T12:00:00`) : null);
const parseDateTime = (value: string | null | undefined) => (value ? new Date(value) : null);
const emptyToNull = (value: string | null | undefined) => value?.trim() || null;
const eurosToCents = (value: string | number | undefined) => {
  if (value === undefined || value === "") return 0;
  const amount = typeof value === "number" ? value : Number(value.replace(",", "."));
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};

const refresh = (...paths: string[]) => [...new Set([...paths, "/analitica"])].forEach((path) => revalidatePath(path));

export async function saveClinic(input: z.input<typeof clinicSchema>) {
  await assertAuthenticatedUser();
  const values = clinicSchema.parse(input);
  const data = {
    name: values.name,
    city: emptyToNull(values.city),
    contactName: emptyToNull(values.contactName),
    phone: emptyToNull(values.phone),
    email: emptyToNull(values.email),
    instagram: emptyToNull(values.instagram),
    website: emptyToNull(values.website),
    phase: values.phase,
    leadSource: emptyToNull(values.leadSource),
    firstContactAt: parseDate(values.firstContactAt),
    nextFollowUpAt: parseDate(values.nextFollowUpAt),
    monthlyFeeCents: eurosToCents(values.monthlyFee),
  };

  if (values.id) {
    await prisma.$transaction(async (tx) => {
      await lockClinic(tx, values.id!, values.expectedPhase);
      await transitionClinic(tx, values.id!, values.phase);
      await tx.clinic.update({ where: { id: values.id }, data });
    });
  } else {
    await prisma.clinic.create({ data: { ...data, stageEvents: { create: { toPhase: values.phase } } } });
  }

  await recordMrrSnapshot();
  refresh("/clientes", "/hoy", "/finanzas");
}

export async function moveClinic(id: string, phase: z.infer<typeof clinicSchema>["phase"]) {
  await assertAuthenticatedUser();
  const parsedId = z.string().min(1).parse(id);
  const parsedPhase = clinicSchema.shape.phase.parse(phase);
  await prisma.$transaction((tx) => transitionClinic(tx, parsedId, parsedPhase));
  await recordMrrSnapshot();
  refresh("/clientes", "/hoy", "/finanzas");
}

export async function setProcessStep(input: { clinicId: string; phase: string; stepKey: string; completed: boolean }) {
  await assertAuthenticatedUser();
  const values = z.object({ clinicId: z.string().min(1), phase: clinicSchema.shape.phase, stepKey: z.string(), completed: z.boolean() }).parse(input);
  if (!phaseGuides[values.phase].steps.some((step) => step.key === values.stepKey)) throw new Error("El paso no pertenece a esta fase.");
  await prisma.$transaction(async (tx) => {
    await lockClinic(tx, values.clinicId, values.phase);
    const key = { clinicId: values.clinicId, phase: values.phase, stepKey: values.stepKey };
    await tx.clinicProcessStep.upsert({ where: { clinicId_phase_stepKey: key }, create: { ...key, completedAt: values.completed ? new Date() : null }, update: { completedAt: values.completed ? new Date() : null } });
  });
  refresh("/clientes");
}

export async function advanceClinic(input: { clinicId: string; phase: string }) {
  await assertAuthenticatedUser();
  const values = z.object({ clinicId: z.string().min(1), phase: clinicSchema.shape.phase }).parse(input);
  const next = phaseGuides[values.phase].next;
  if (!next) throw new Error("Esta fase no tiene un siguiente paso comercial.");
  await prisma.$transaction((tx) => transitionClinic(tx, values.clinicId, next, values.phase, true));
  await recordMrrSnapshot();
  refresh("/clientes", "/hoy", "/finanzas");
  return { phase: next };
}

export async function addInteraction(input: { clinicId: string; note: string; occurredAt?: string }) {
  await assertAuthenticatedUser();
  const values = z.object({ clinicId: z.string().min(1), note: z.string().trim().min(1), occurredAt: z.string().optional() }).parse(input);
  const occurredAt = parseDateTime(values.occurredAt) ?? new Date();
  await prisma.$transaction([
    prisma.interaction.create({ data: { clinicId: values.clinicId, note: values.note, occurredAt } }),
    prisma.clinic.update({ where: { id: values.clinicId }, data: { lastInteractionAt: occurredAt } }),
  ]);
  refresh("/clientes", "/hoy");
}

export async function deleteClinic(id: string) {
  await assertAuthenticatedUser();
  await prisma.clinic.delete({ where: { id: z.string().min(1).parse(id) } });
  await recordMrrSnapshot();
  refresh("/clientes", "/hoy", "/finanzas", "/tareas");
}

const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  description: optionalText,
  category: optionalText,
  priority: z.enum(["URGENT", "IMPORTANT"]).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  dueAt: optionalText,
  clinicId: optionalText,
  blocksPhase: z.enum(gatePhases).optional().nullable(),
});

export async function saveTask(input: z.input<typeof taskSchema>) {
  await assertAuthenticatedUser();
  const values = taskSchema.parse(input);
  const clinicId = emptyToNull(values.clinicId);
  const data = {
    title: values.title,
    description: emptyToNull(values.description),
    category: emptyToNull(values.category),
    priority: values.priority || null,
    status: values.status,
    dueAt: parseDate(values.dueAt),
    clinicId,
    // Solo una tarea vinculada a una clínica puede bloquear su avance.
    blocksPhase: clinicId ? values.blocksPhase ?? null : null,
    completedAt: values.status === "DONE" ? new Date() : null,
  };
  if (values.id) await prisma.task.update({ where: { id: values.id }, data });
  else await prisma.task.create({ data });
  refresh("/tareas", "/hoy", "/clientes", "/agenda");
}

export async function moveTask(id: string, status: "TODO" | "IN_PROGRESS" | "DONE") {
  await assertAuthenticatedUser();
  const parsedStatus = z.enum(["TODO", "IN_PROGRESS", "DONE"]).parse(status);
  await prisma.task.update({ where: { id: z.string().min(1).parse(id) }, data: { status: parsedStatus, completedAt: parsedStatus === "DONE" ? new Date() : null } });
  refresh("/tareas", "/hoy", "/clientes", "/agenda");
}

export async function deleteTask(id: string) {
  await assertAuthenticatedUser();
  await prisma.task.delete({ where: { id: z.string().min(1).parse(id) } });
  refresh("/tareas", "/hoy", "/clientes", "/agenda");
}

export async function setGoalStepCompleted(input: { id: string; completed: boolean }) {
  await assertAuthenticatedUser();
  const values = z.object({ id: z.string().min(1).max(100), completed: z.boolean() }).parse(input);
  const result = await prisma.goalStep.updateMany({
    where: { id: values.id },
    data: { completedAt: values.completed ? new Date() : null },
  });
  if (result.count !== 1) throw new Error("El paso del objetivo no existe.");
  revalidatePath("/objetivos");
}

export async function saveGoalStepAnswer(input: { id: string; answer: string }) {
  await assertAuthenticatedUser();
  const values = z.object({ id: z.string().min(1).max(100), answer: z.string().trim().max(4000) }).parse(input);
  if (!hasGoalStepField(values.id)) throw new Error("Este paso no tiene un campo editable.");
  const result = await prisma.goalStep.updateMany({
    where: { id: values.id },
    data: { answer: values.answer || null },
  });
  if (result.count !== 1) throw new Error("El paso del objetivo no existe.");
  revalidatePath("/objetivos");
}

const competitorSchema = z.object({
  id: z.string().optional(),
  threatLevel: z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4", "LEVEL_5", "INTERNATIONAL"]),
  ranking: z.coerce.number().int().positive().optional().nullable(),
  company: z.string().trim().min(1),
  agencyType: optionalText,
  category: z.enum(["AI", "MARKETING", "MIXED"]),
  niche: optionalText,
  instagram: optionalText,
  followersCount: z.coerce.number().int().nonnegative().optional().nullable(),
  postCount: z.coerce.number().int().nonnegative().optional().nullable(),
  website: optionalText,
  location: optionalText,
  trackRecord: optionalText,
  publicPrice: optionalText,
  ownNotes: optionalText,
  followed: z.boolean().optional(),
  lastReviewedAt: optionalText,
});

export type CompetitorImportRow = z.input<typeof competitorSchema>;

export async function saveCompetitor(input: CompetitorImportRow) {
  await assertAuthenticatedUser();
  const values = competitorSchema.parse(input);
  const data = {
    threatLevel: values.threatLevel,
    ranking: values.ranking ?? null,
    company: values.company,
    agencyType: emptyToNull(values.agencyType),
    category: values.category,
    niche: emptyToNull(values.niche),
    instagram: emptyToNull(values.instagram),
    followersCount: values.followersCount ?? null,
    postCount: values.postCount ?? null,
    website: emptyToNull(values.website),
    location: emptyToNull(values.location),
    trackRecord: emptyToNull(values.trackRecord),
    publicPrice: emptyToNull(values.publicPrice),
    ownNotes: emptyToNull(values.ownNotes),
    followed: values.followed ?? false,
    lastReviewedAt: parseDate(values.lastReviewedAt),
  };
  if (values.id) await prisma.competitor.update({ where: { id: values.id }, data });
  else await prisma.competitor.create({ data });
  refresh("/competencia");
}

export async function importCompetitors(rows: CompetitorImportRow[]) {
  await assertAuthenticatedUser();
  const parsed = z.array(competitorSchema.omit({ id: true })).max(1000).parse(rows);
  await prisma.competitor.createMany({
    data: parsed.map((values) => ({
      threatLevel: values.threatLevel,
      ranking: values.ranking ?? null,
      company: values.company,
      agencyType: emptyToNull(values.agencyType),
      category: values.category,
      niche: emptyToNull(values.niche),
      instagram: emptyToNull(values.instagram),
      followersCount: values.followersCount ?? null,
      postCount: values.postCount ?? null,
      website: emptyToNull(values.website),
      location: emptyToNull(values.location),
      trackRecord: emptyToNull(values.trackRecord),
      publicPrice: emptyToNull(values.publicPrice),
      ownNotes: emptyToNull(values.ownNotes),
      followed: values.followed ?? false,
      lastReviewedAt: parseDate(values.lastReviewedAt),
    })),
  });
  refresh("/competencia");
}

export async function toggleCompetitorFollowed(id: string, followed: boolean) {
  await assertAuthenticatedUser();
  await prisma.competitor.update({ where: { id: z.string().min(1).parse(id) }, data: { followed: z.boolean().parse(followed), lastReviewedAt: new Date() } });
  refresh("/competencia");
}

export async function deleteCompetitor(id: string) {
  await assertAuthenticatedUser();
  await prisma.competitor.delete({ where: { id: z.string().min(1).parse(id) } });
  refresh("/competencia");
}

const contentSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  format: z.enum(["IMAGE", "CAROUSEL", "REEL"]),
  status: z.enum(["IDEA", "SCRIPT", "DESIGN", "SCHEDULED", "PUBLISHED"]),
  scheduledFor: optionalText,
  script: optionalText,
});

export async function saveContentItem(input: z.input<typeof contentSchema>) {
  await assertAuthenticatedUser();
  const values = contentSchema.parse(input);
  const data = { title: values.title, format: values.format, status: values.status, scheduledFor: parseDate(values.scheduledFor), script: emptyToNull(values.script) };
  if (values.id) await prisma.contentItem.update({ where: { id: values.id }, data });
  else await prisma.contentItem.create({ data });
  refresh("/agenda");
}

export async function deleteContentItem(id: string) {
  await assertAuthenticatedUser();
  await prisma.contentItem.delete({ where: { id: z.string().min(1).parse(id) } });
  refresh("/agenda");
}

const financeSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().trim().min(1),
  amount: z.union([z.string(), z.number()]),
  occurredAt: z.string().min(1),
  clinicId: optionalText,
  expenseFrequency: z.enum(expenseFrequencies).optional().nullable(),
  expensePayer: z.enum(expensePayers).optional().nullable(),
});

export async function saveFinanceEntry(input: z.input<typeof financeSchema>) {
  await assertAuthenticatedUser();
  const values = financeSchema.parse(input);
  if (values.type === "EXPENSE" && (!values.expenseFrequency || !values.expensePayer)) throw new Error("Indica la frecuencia y quién paga el gasto");
  const amountCents = eurosToCents(values.amount);
  if (amountCents <= 0) throw new Error("El importe debe ser mayor que cero");
  const data = {
    type: values.type,
    description: values.description,
    amountCents,
    occurredAt: parseDate(values.occurredAt)!,
    clinicId: emptyToNull(values.clinicId),
    expenseFrequency: values.type === "EXPENSE" ? values.expenseFrequency : null,
    expensePayer: values.type === "EXPENSE" ? values.expensePayer : null,
  };
  if (values.id) await prisma.financeEntry.update({ where: { id: values.id }, data });
  else await prisma.financeEntry.create({ data });
  refresh("/finanzas", "/hoy");
}

export async function deleteFinanceEntry(id: string) {
  await assertAuthenticatedUser();
  await prisma.financeEntry.delete({ where: { id: z.string().min(1).parse(id) } });
  refresh("/finanzas");
}

// ─────────────────────────── Gestor de contraseñas ───────────────────────────
//
// La sesión autentica el acceso; las cuentas se cifran en el servidor antes de
// guardarse. Nunca se registra ni devuelve una contraseña desde estas acciones.
const vaultUrl = z.union([z.literal(""), z.null(), z.undefined(), z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), "Solo enlaces http o https")]);
const vaultAccountSchema = z.object({
  label: z.string().max(120),
  username: z.string().max(320),
  password: z.string().max(2000),
  notes: z.string().max(3000),
});

const vaultItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(200),
  url: vaultUrl,
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().nullable(),
  accounts: z.array(vaultAccountSchema).max(20),
});

export async function saveVaultItem(input: z.input<typeof vaultItemSchema>) {
  await assertAuthenticatedUser();
  const values = vaultItemSchema.parse(input);
  const accounts = values.accounts.filter((account) => !isAccountEmpty(account));
  const data = {
    title: values.title,
    url: values.url || null,
    category: values.category,
    description: emptyToNull(values.description),
    secret: accounts.length ? sealVaultAccounts(accounts) : null,
  };
  if (values.id) await prisma.vaultItem.update({ where: { id: values.id }, data });
  else await prisma.vaultItem.create({ data });
  refresh("/contrasenas");
}

export async function deleteVaultItem(id: string) {
  await assertAuthenticatedUser();
  await prisma.vaultItem.delete({ where: { id: z.string().min(1).parse(id) } });
  refresh("/contrasenas");
}

export async function getVaultItemAccounts(id: string) {
  await assertAuthenticatedUser();
  const item = await prisma.vaultItem.findUnique({ where: { id: z.string().min(1).parse(id) }, select: { secret: true } });
  if (!item) throw new Error("La entrada no existe.");
  return item.secret ? openVaultAccounts(item.secret) : [];
}

const noteSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  body: z.string(),
  tags: z.array(z.string().trim().min(1)).max(12),
});

export async function saveNote(input: z.input<typeof noteSchema>) {
  await assertAuthenticatedUser();
  const values = noteSchema.parse(input);
  const tagConnect = values.tags.map((name) => ({ where: { name }, create: { name } }));
  if (values.id) {
    await prisma.note.update({ where: { id: values.id }, data: { title: values.title, body: values.body, tags: { set: [], connectOrCreate: tagConnect } } });
  } else {
    await prisma.note.create({ data: { title: values.title, body: values.body, tags: { connectOrCreate: tagConnect } } });
  }
  refresh("/notas");
}

export async function deleteNote(id: string) {
  await assertAuthenticatedUser();
  await prisma.note.delete({ where: { id: z.string().min(1).parse(id) } });
  refresh("/notas");
}

// ───────────────────────────── Mapa mental ─────────────────────────────
//
// El lienzo trabaja en memoria y se guarda a mano: saveMindMap recibe el estado
// completo del mapa en una única petición y lo escribe en una sola transacción.
// Los nodos Cliente, Competidor e Idea de contenido guardan solo el id del
// registro real; sus datos se leen en vivo con getMindMapRecords.

const nodeKindSchema = z.enum(["SHAPE", "STICKY", "DRAWING", "CLIENT", "COMPETITOR", "CONTENT_IDEA", "GROUP", "IMAGE", "LINK", "TABLE"]);
const edgeStyleSchema = z.enum(["SOLID", "DASHED", "ARROW"]);
const mapElementId = z.string().min(1).max(64);
const webUrl = z.string().max(2048).url().refine((value) => /^https?:\/\//i.test(value), "Solo enlaces http(s)");

export async function listMindMaps() {
  await assertAuthenticatedUser();
  return prisma.mindMap.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, name: true, updatedAt: true } });
}

export async function createMindMap(name: string) {
  await assertAuthenticatedUser();
  const parsedName = z.string().trim().min(1, "El nombre es obligatorio").parse(name);
  const map = await prisma.mindMap.create({ data: { name: parsedName } });
  return map.id;
}

const recordIdsSchema = z.object({
  clinicIds: z.array(mapElementId).max(1000),
  competitorIds: z.array(mapElementId).max(1000),
  contentItemIds: z.array(mapElementId).max(1000),
});

// Datos en vivo de los registros que referencian los nodos. Recibe los ids desde
// el lienzo (incluidos los de nodos aún sin guardar). Se llama al cargar el mapa
// y al volver a la pestaña.
export async function getMindMapRecords(input: z.input<typeof recordIdsSchema>) {
  await assertAuthenticatedUser();
  const { clinicIds, competitorIds, contentItemIds } = recordIdsSchema.parse(input);

  const [clinics, competitors, contentItems] = await Promise.all([
    clinicIds.length ? prisma.clinic.findMany({ where: { id: { in: clinicIds } }, select: { id: true, name: true, phase: true, nextFollowUpAt: true } }) : Promise.resolve([]),
    competitorIds.length ? prisma.competitor.findMany({ where: { id: { in: competitorIds } }, select: { id: true, company: true, threatLevel: true, followersCount: true } }) : Promise.resolve([]),
    contentItemIds.length ? prisma.contentItem.findMany({ where: { id: { in: contentItemIds } }, select: { id: true, title: true, status: true, format: true } }) : Promise.resolve([]),
  ]);

  return {
    clinics: Object.fromEntries(clinics.map((c) => [c.id, { name: c.name, phase: c.phase, nextFollowUpAt: c.nextFollowUpAt?.toISOString() ?? null }])),
    competitors: Object.fromEntries(competitors.map((c) => [c.id, { company: c.company, threatLevel: c.threatLevel, followersCount: c.followersCount }])),
    contentItems: Object.fromEntries(contentItems.map((c) => [c.id, { title: c.title, status: c.status, format: c.format }])),
  };
}

export async function searchClinicsForMap(query: string) {
  await assertAuthenticatedUser();
  const q = z.string().trim().max(200).parse(query);
  const rows = await prisma.clinic.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 20,
    select: { id: true, name: true, phase: true, nextFollowUpAt: true },
  });
  return rows.map((row) => ({ ...row, nextFollowUpAt: row.nextFollowUpAt?.toISOString() ?? null }));
}

export async function searchCompetitorsForMap(query: string) {
  await assertAuthenticatedUser();
  const q = z.string().trim().max(200).parse(query);
  return prisma.competitor.findMany({
    where: q ? { company: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { company: "asc" },
    take: 20,
    select: { id: true, company: true, threatLevel: true, followersCount: true },
  });
}

// Ficha completa de una clínica para abrir el mismo panel que usa la sección
// de clientes (con su historial de interacciones) al hacer doble clic en un
// nodo Cliente del mapa.
export async function getClinicDetail(id: string): Promise<ClientData | null> {
  await assertAuthenticatedUser();
  const parsedId = z.string().min(1).parse(id);
  const clinic = await prisma.clinic.findUnique({ where: { id: parsedId }, include: { interactions: { orderBy: { occurredAt: "desc" } }, stageEvents: true, processSteps: true, tasks: { select: { id: true, title: true, status: true, blocksPhase: true } } } });
  if (!clinic) return null;
  return {
    id: clinic.id,
    name: clinic.name,
    city: clinic.city,
    contactName: clinic.contactName,
    phone: clinic.phone,
    email: clinic.email,
    instagram: clinic.instagram,
    website: clinic.website,
    phase: clinic.phase,
    leadSource: clinic.leadSource,
    firstContactAt: clinic.firstContactAt?.toISOString() ?? null,
    lastInteractionAt: clinic.lastInteractionAt?.toISOString() ?? null,
    nextFollowUpAt: clinic.nextFollowUpAt?.toISOString() ?? null,
    monthlyFeeCents: clinic.monthlyFeeCents,
    createdAt: clinic.createdAt.toISOString(),
    processSteps: clinic.processSteps.map((step) => ({ phase: step.phase, stepKey: step.stepKey, completedAt: step.completedAt?.toISOString() ?? null })),
    stageEvents: clinic.stageEvents.map((event) => ({ ...event, changedAt: event.changedAt.toISOString() })),
    tasks: clinic.tasks,
    interactions: clinic.interactions.map((item) => ({ id: item.id, note: item.note, occurredAt: item.occurredAt.toISOString() })),
  };
}

const saveNodeSchema = z.object({
  id: mapElementId,
  kind: nodeKindSchema,
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive().nullable(),
  height: z.number().finite().positive().nullable(),
  parentId: mapElementId.nullable(),
  text: z.string().max(20000).nullable(),
  color: z.string().max(32).nullable(),
  clinicId: mapElementId.nullable(),
  competitorId: mapElementId.nullable(),
  contentItemId: mapElementId.nullable(),
  style: z.object({
    shape: z.enum(shapeKinds).optional(),
    stroke: z.enum(strokeStyles).optional(),
    font: z.enum(fontFamilies).optional(),
    fontSize: z.enum(fontSizes).optional(),
    align: z.enum(textAligns).optional(),
    tool: z.enum(drawingTools).optional(),
    strokeWidth: z.number().finite().positive().max(200).optional(),
    baseWidth: z.number().finite().positive().optional(),
    baseHeight: z.number().finite().positive().optional(),
  }).nullable(),
  points: z.array(z.tuple([z.number().finite(), z.number().finite()])).max(10000).nullable(),
  media: z.object({
    src: webUrl.optional(),
    path: z.string().regex(/^[\w-]+\.(png|jpg|webp|gif)$/).optional(),
    naturalWidth: z.number().finite().positive().optional(),
    naturalHeight: z.number().finite().positive().optional(),
    url: webUrl.optional(),
    title: z.string().max(500).optional(),
    description: z.string().max(1000).optional(),
    image: webUrl.optional(),
    favicon: webUrl.optional(),
    siteName: z.string().max(200).optional(),
    provider: z.enum(linkProviders).optional(),
    videoId: z.string().regex(/^[\w-]{6,20}$/).optional(),
    cells: z.array(z.array(z.string().max(2000)).min(1).max(TABLE_MAX_COLS)).min(1).max(TABLE_MAX_ROWS).optional(),
    header: z.boolean().optional(),
  }).nullable().default(null),
});

const saveEdgeSchema = z.object({
  id: mapElementId,
  sourceId: mapElementId,
  targetId: mapElementId,
  sourceHandle: z.string().max(32).nullable(),
  targetHandle: z.string().max(32).nullable(),
  label: z.string().max(500).nullable(),
  style: edgeStyleSchema,
  options: z.object({
    path: z.enum(edgePaths).optional(),
    start: z.enum(edgeCaps).optional(),
    end: z.enum(edgeCaps).optional(),
    color: z.string().max(32).optional(),
    width: z.number().finite().positive().max(12).optional(),
    dashed: z.boolean().optional(),
  }).nullable().default(null),
});

const saveMindMapSchema = z.object({
  mapId: z.string().min(1),
  expectedUpdatedAt: z.string().min(1),
  force: z.boolean().default(false),
  nodes: z.array(saveNodeSchema).max(2000),
  edges: z.array(saveEdgeSchema).max(5000),
});

export type SaveMindMapResult = { status: "saved"; updatedAt: string } | { status: "conflict" };

// Guarda el estado completo del mapa. Si otra persona lo guardó desde que se
// cargó (updatedAt distinto) devuelve "conflict" sin escribir nada, salvo que
// se pida sobrescribir.
export async function saveMindMap(input: z.input<typeof saveMindMapSchema>): Promise<SaveMindMapResult> {
  await assertAuthenticatedUser();
  const { mapId, expectedUpdatedAt, force, nodes, edges } = saveMindMapSchema.parse(input);
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (nodeIds.size !== nodes.length || new Set(edges.map((edge) => edge.id)).size !== edges.length) {
    throw new Error("El mapa contiene elementos duplicados");
  }
  const referenced = (key: "clinicId" | "competitorId" | "contentItemId") => [...new Set(nodes.map((node) => node[key]).filter((value): value is string => Boolean(value)))];

  let previousImagePaths: string[] = [];
  const result = await prisma.$transaction(async (tx): Promise<SaveMindMapResult> => {
    // Bloquea la fila del mapa para que dos guardados simultáneos no pasen a la vez la comprobación de versión.
    const [map] = await tx.$queryRaw<{ updatedAt: Date }[]>`SELECT "updatedAt" FROM "MindMap" WHERE "id" = ${mapId} FOR UPDATE`;
    if (!map) throw new Error("El mapa no existe");
    if (!force && map.updatedAt.toISOString() !== expectedUpdatedAt) return { status: "conflict" };

    // Imágenes subidas que tenía el mapa guardado: las que ya no aparecen se borran de Storage al terminar.
    const previousImages = await tx.mindMapNode.findMany({ where: { mapId, kind: "IMAGE" }, select: { media: true } });
    previousImagePaths = previousImages.map((node) => (node.media as { path?: string } | null)?.path).filter((path): path is string => Boolean(path));

    // Una referencia a un registro que ya no existe se guarda vacía (nodo huérfano) en vez de romper la clave foránea.
    const existingIds = (rows: { id: string }[]) => new Set(rows.map((row) => row.id));
    const clinicIds = existingIds(await tx.clinic.findMany({ where: { id: { in: referenced("clinicId") } }, select: { id: true } }));
    const competitorIds = existingIds(await tx.competitor.findMany({ where: { id: { in: referenced("competitorId") } }, select: { id: true } }));
    const contentItemIds = existingIds(await tx.contentItem.findMany({ where: { id: { in: referenced("contentItemId") } }, select: { id: true } }));

    // Cada nodo solo rellena los campos de su tipo (CHECK de la tabla) y su padre tiene que venir en el mismo guardado.
    // El texto con formato de formas y pósits se sanea también aquí, no solo al pintarlo.
    const nodeData = nodes.map((node) => {
      const styled = node.kind === "SHAPE" || node.kind === "STICKY" || node.kind === "DRAWING";
      const media = (node.kind === "IMAGE" && node.media?.src) || (node.kind === "LINK" && node.media?.url) || (node.kind === "TABLE" && node.media?.cells) ? node.media : null;
      const richText = node.kind === "SHAPE" || node.kind === "STICKY";
      return {
        id: node.id,
        mapId,
        kind: node.kind,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        parentId: node.parentId && node.parentId !== node.id && nodeIds.has(node.parentId) ? node.parentId : null,
        text: richText && node.text ? sanitizeRichText(node.text) : node.kind === "CONTENT_IDEA" || node.kind === "GROUP" ? node.text : null,
        color: styled || node.kind === "GROUP" ? node.color : null,
        clinicId: node.kind === "CLIENT" && node.clinicId && clinicIds.has(node.clinicId) ? node.clinicId : null,
        competitorId: node.kind === "COMPETITOR" && node.competitorId && competitorIds.has(node.competitorId) ? node.competitorId : null,
        contentItemId: node.kind === "CONTENT_IDEA" && node.contentItemId && contentItemIds.has(node.contentItemId) ? node.contentItemId : null,
        style: styled && node.style ? node.style : Prisma.DbNull,
        points: node.kind === "DRAWING" && node.points ? node.points : Prisma.DbNull,
        media: media ?? Prisma.DbNull,
      };
    });
    const edgeData = edges
      .filter((edge) => edge.sourceId !== edge.targetId && nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId))
      .map((edge) => ({
        ...edge,
        mapId,
        // La columna style se sigue rellenando para que los mapas antiguos y las lecturas simples coincidan.
        style: edge.options ? (edge.options.dashed ? "DASHED" as const : edge.options.end && edge.options.end !== "none" ? "ARROW" as const : "SOLID" as const) : edge.style,
        options: edge.options ?? Prisma.DbNull,
      }));

    // Sustituye el contenido completo del mapa. Borrar los nodos arrastra sus
    // conexiones (ON DELETE CASCADE); un único INSERT recrea los nodos con sus
    // ids y Postgres comprueba la clave del padre al final de la sentencia, así
    // que no importa si un hijo va antes que su grupo.
    await tx.mindMapNode.deleteMany({ where: { mapId } });
    if (nodeData.length) await tx.mindMapNode.createMany({ data: nodeData });
    if (edgeData.length) await tx.mindMapEdge.createMany({ data: edgeData });
    const updated = await tx.mindMap.update({ where: { id: mapId }, data: { updatedAt: new Date() } });
    return { status: "saved", updatedAt: updated.updatedAt.toISOString() };
  }, { maxWait: 10_000, timeout: 20_000 });

  if (result.status === "saved") {
    const kept = new Set(nodes.map((node) => node.media?.path).filter(Boolean));
    const removed = previousImagePaths.filter((path) => !kept.has(path));
    if (removed.length) {
      // Si falla, la imagen solo queda huérfana en Storage: no debe romper el guardado.
      const supabase = await createClient();
      await supabase.storage.from(MIND_MAP_IMAGE_BUCKET).remove(removed).catch(() => null);
    }
  }
  return result;
}

// Vista previa (título, descripción, miniatura) de un enlace pegado en el mapa.
// Si la dirección es directamente una imagen, el lienzo crea un nodo Imagen.
export async function getLinkPreview(url: string) {
  await assertAuthenticatedUser();
  return fetchLinkPreview(webUrl.parse(url.trim()));
}

const convertIdeaSchema = z.object({
  title: z.string().trim().max(500),
  format: z.enum(["IMAGE", "CAROUSEL", "REEL"]),
});

// Crea la pieza en Contenido al momento. El nodo del mapa pasa a referenciarla
// en el lienzo y queda guardado con el resto del mapa al pulsar Guardar.
export async function convertIdeaToContent(input: z.input<typeof convertIdeaSchema>) {
  await assertAuthenticatedUser();
  const { title, format } = convertIdeaSchema.parse(input);
  const item = await prisma.contentItem.create({ data: { title: title || "Idea sin título", format, status: "IDEA" } });
  refresh("/agenda");
  return { id: item.id, title: item.title, status: item.status, format: item.format };
}

// ─────────────────────────── Ajustes: menú lateral ───────────────────────────

const navHref = z.string().refine((href) => navigationHrefs.includes(href), "Apartado desconocido");
const navPreferencesSchema = z.object({ order: z.array(navHref).max(50), hidden: z.array(navHref).max(50) });

// Orden y apartados ocultos del menú de la persona que ha iniciado sesión.
export async function saveNavigationPreferences(input: z.input<typeof navPreferencesSchema>) {
  const user = await assertAuthenticatedUser();
  const values = navPreferencesSchema.parse(input);
  const order = [...new Set(values.order)];
  const hidden = [...new Set(values.hidden)];
  if (hidden.length >= navigationHrefs.length) throw new Error("Deja al menos un apartado visible en el menú.");
  await saveUserPreference(user.id, { navOrder: order, hiddenNav: hidden });
  revalidatePath("/", "layout");
}

async function saveUserPreference(userId: string, data: Omit<Prisma.UserPreferenceUncheckedCreateInput, "userId">) {
  await prisma.userPreference.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

export async function saveProfile(input: { displayName: string }) {
  const user = await assertAuthenticatedUser();
  const { displayName } = z.object({ displayName: z.string().trim().max(60, "Máximo 60 caracteres") }).parse(input);
  await saveUserPreference(user.id, { displayName: displayName || null });
  revalidatePath("/", "layout");
}

const appearanceSchema = z.object({ theme: z.enum(themes), accent: z.enum(accents), textSize: z.enum(textSizes), reduceMotion: z.boolean() });

// Guarda la apariencia en la cuenta y en la cookie de este dispositivo.
export async function saveAppearance(input: z.input<typeof appearanceSchema>) {
  const user = await assertAuthenticatedUser();
  const values = appearanceSchema.parse(input);
  await saveUserPreference(user.id, values);
  (await cookies()).set(APPEARANCE_COOKIE, serializeAppearance(values), { path: "/", maxAge: APPEARANCE_COOKIE_MAX_AGE, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function saveStartPage(startPage: string) {
  const user = await assertAuthenticatedUser();
  await saveUserPreference(user.id, { startPage: navHref.parse(startPage) });
}

export async function deletePushSubscriptionById(id: string) {
  await assertAuthenticatedUser();
  await prisma.pushSubscription.deleteMany({ where: { id: z.string().min(1).parse(id) } });
  revalidatePath("/ajustes");
  revalidatePath("/agenda");
}

// ─────────────────────── Agenda: recordatorios y avisos ───────────────────────

const reminderSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).optional().nullable(),
  // Instante exacto en ISO con zona: el navegador convierte la hora local que se eligió.
  remindAt: z.string().datetime({ offset: true }),
});

export async function saveReminder(input: z.input<typeof reminderSchema>) {
  await assertAuthenticatedUser();
  const values = reminderSchema.parse(input);
  const remindAt = new Date(values.remindAt);
  const data = { title: values.title, notes: emptyToNull(values.notes), remindAt };
  if (values.id) {
    const current = await prisma.reminder.findUniqueOrThrow({ where: { id: values.id }, select: { remindAt: true } });
    // Si cambia la hora, el aviso vuelve a quedar pendiente de enviar.
    await prisma.reminder.update({ where: { id: values.id }, data: { ...data, ...(current.remindAt.getTime() !== remindAt.getTime() ? { sentAt: null } : {}) } });
  } else {
    await prisma.reminder.create({ data });
  }
  refresh("/agenda", "/hoy");
}

export async function setReminderDone(id: string, done: boolean) {
  await assertAuthenticatedUser();
  await prisma.reminder.update({ where: { id: z.string().min(1).parse(id) }, data: { doneAt: z.boolean().parse(done) ? new Date() : null } });
  refresh("/agenda", "/hoy");
}

export async function deleteReminder(id: string) {
  await assertAuthenticatedUser();
  await prisma.reminder.delete({ where: { id: z.string().min(1).parse(id) } });
  refresh("/agenda", "/hoy");
}

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2000).refine((value) => value.startsWith("https://"), "Endpoint no válido"),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
  userAgent: z.string().max(400).optional(),
});

export async function savePushSubscription(input: z.input<typeof pushSubscriptionSchema>) {
  const user = await assertAuthenticatedUser();
  const values = pushSubscriptionSchema.parse(input);
  const data = { userId: user.id, p256dh: values.keys.p256dh, auth: values.keys.auth, userAgent: values.userAgent ?? null };
  await prisma.pushSubscription.upsert({ where: { endpoint: values.endpoint }, create: { endpoint: values.endpoint, ...data }, update: data });
  return { devices: await prisma.pushSubscription.count() };
}

export async function deletePushSubscription(endpoint: string) {
  await assertAuthenticatedUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint: z.string().url().parse(endpoint) } });
  return { devices: await prisma.pushSubscription.count() };
}

export async function sendTestPush() {
  await assertAuthenticatedUser();
  if (!pushConfigured()) throw new Error("Los avisos no están configurados en el servidor.");
  const host = (await headers()).get("host");
  return sendPushToAll({ title: "Avisos activados", body: "Así te llegarán los recordatorios de la Agenda.", url: "/agenda", tag: "test" }, host ? `https://${host}` : "https://localhost");
}
