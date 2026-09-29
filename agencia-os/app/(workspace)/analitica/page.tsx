import { AnalyticsWorkspace } from "@/components/analytics/analytics-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const views = { propuestas: "proposals", web: "web" } as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  // Visitas web: el último año basta para los filtros de periodo de la vista.
  const now = new Date();
  const lastYear = new Date(now);
  lastYear.setDate(lastYear.getDate() - 366);
  const [clients, finances, tasks, content, proposalEvents, siteSessions, sitePageviews] = await Promise.all([
    prisma.clinic.findMany({ select: { id: true, name: true, phase: true, city: true, leadSource: true, createdAt: true, firstContactAt: true, nextFollowUpAt: true, monthlyFeeCents: true, stageEvents: { select: { fromPhase: true, toPhase: true, changedAt: true } } } }),
    prisma.financeEntry.findMany({ select: { type: true, amountCents: true, occurredAt: true } }),
    prisma.task.findMany({ select: { status: true, createdAt: true, dueAt: true } }),
    prisma.contentItem.findMany({ select: { status: true, createdAt: true } }),
    prisma.proposalEvent.findMany({ orderBy: { occurredAt: "desc" }, take: 5000, select: { slug: true, clinicName: true, event: true, seconds: true, device: true, city: true, occurredAt: true } }),
    prisma.siteSession.findMany({ where: { startedAt: { gte: lastYear } }, orderBy: { startedAt: "desc" }, take: 20000, select: { id: true, site: true, source: true, landingPath: true, currentPath: true, device: true, city: true, pageviews: true, converted: true, startedAt: true, lastSeenAt: true } }),
    prisma.sitePageview.findMany({ where: { occurredAt: { gte: lastYear } }, orderBy: { occurredAt: "desc" }, take: 50000, select: { site: true, path: true, occurredAt: true } }),
  ]);
  return <AnalyticsWorkspace initialView={views[vista as keyof typeof views] ?? "commercial"} data={{
    now: now.toISOString(),
    clients: clients.map((client) => ({ ...client, createdAt: client.createdAt.toISOString(), firstContactAt: client.firstContactAt?.toISOString() ?? null, nextFollowUpAt: client.nextFollowUpAt?.toISOString() ?? null, stageEvents: client.stageEvents.map((event) => ({ ...event, changedAt: event.changedAt.toISOString() })) })),
    finances: finances.map((entry) => ({ ...entry, occurredAt: entry.occurredAt.toISOString() })),
    tasks: tasks.map((task) => ({ ...task, createdAt: task.createdAt.toISOString(), dueAt: task.dueAt?.toISOString() ?? null })),
    content: content.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    proposalEvents: proposalEvents.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString() })),
    siteSessions: siteSessions.map((session) => ({ ...session, startedAt: session.startedAt.toISOString(), lastSeenAt: session.lastSeenAt.toISOString() })),
    sitePageviews: sitePageviews.map((view) => ({ ...view, occurredAt: view.occurredAt.toISOString() })),
  }} />;
}
