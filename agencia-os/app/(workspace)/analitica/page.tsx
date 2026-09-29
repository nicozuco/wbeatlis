import { AnalyticsWorkspace } from "@/components/analytics/analytics-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const [clients, finances, tasks, content, proposalEvents] = await Promise.all([
    prisma.clinic.findMany({ select: { id: true, name: true, phase: true, city: true, leadSource: true, createdAt: true, firstContactAt: true, nextFollowUpAt: true, monthlyFeeCents: true, stageEvents: { select: { fromPhase: true, toPhase: true, changedAt: true } } } }),
    prisma.financeEntry.findMany({ select: { type: true, amountCents: true, occurredAt: true } }),
    prisma.task.findMany({ select: { status: true, createdAt: true, dueAt: true } }),
    prisma.contentItem.findMany({ select: { status: true, createdAt: true } }),
    prisma.proposalEvent.findMany({ orderBy: { occurredAt: "desc" }, take: 5000, select: { slug: true, clinicName: true, event: true, seconds: true, device: true, city: true, occurredAt: true } }),
  ]);
  return <AnalyticsWorkspace initialView={vista === "propuestas" ? "proposals" : "commercial"} data={{
    now: new Date().toISOString(),
    clients: clients.map((client) => ({ ...client, createdAt: client.createdAt.toISOString(), firstContactAt: client.firstContactAt?.toISOString() ?? null, nextFollowUpAt: client.nextFollowUpAt?.toISOString() ?? null, stageEvents: client.stageEvents.map((event) => ({ ...event, changedAt: event.changedAt.toISOString() })) })),
    finances: finances.map((entry) => ({ ...entry, occurredAt: entry.occurredAt.toISOString() })),
    tasks: tasks.map((task) => ({ ...task, createdAt: task.createdAt.toISOString(), dueAt: task.dueAt?.toISOString() ?? null })),
    content: content.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    proposalEvents: proposalEvents.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString() })),
  }} />;
}
