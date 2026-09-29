import { ClientsWorkspace, type ClientData } from "@/components/clients/clients-workspace";
import { MRR_PHASE } from "@/lib/domain";
import { formatCurrency, formatPercent } from "@/lib/format";
import { pipelineCounts } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.clinic.findMany({
    include: { interactions: { orderBy: { occurredAt: "desc" } }, stageEvents: true, processSteps: true, tasks: { select: { id: true, title: true, status: true, blocksPhase: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const { contacted, responded, contracted } = pipelineCounts(clients);
  const activeClients = clients.filter((client) => client.phase === MRR_PHASE);
  const mrr = activeClients.reduce((sum, client) => sum + client.monthlyFeeCents, 0);

  const serialized: ClientData[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    city: client.city,
    contactName: client.contactName,
    phone: client.phone,
    email: client.email,
    instagram: client.instagram,
    website: client.website,
    phase: client.phase,
    leadSource: client.leadSource,
    firstContactAt: client.firstContactAt?.toISOString() ?? null,
    lastInteractionAt: client.lastInteractionAt?.toISOString() ?? null,
    nextFollowUpAt: client.nextFollowUpAt?.toISOString() ?? null,
    monthlyFeeCents: client.monthlyFeeCents,
    createdAt: client.createdAt.toISOString(),
    processSteps: client.processSteps.map((step) => ({ phase: step.phase, stepKey: step.stepKey, completedAt: step.completedAt?.toISOString() ?? null })),
    stageEvents: client.stageEvents.map((event) => ({ ...event, changedAt: event.changedAt.toISOString() })),
    tasks: client.tasks,
    interactions: client.interactions.map((item) => ({ id: item.id, note: item.note, occurredAt: item.occurredAt.toISOString() })),
  }));

  return <ClientsWorkspace now={new Date().toISOString()} clients={serialized} metrics={{ total: clients.length, responseRate: formatPercent(responded, contacted), responseCount: responded, contractRate: formatPercent(contracted, contacted), contractCount: contracted, mrr: formatCurrency(mrr), activeCount: activeClients.length }} />;
}
