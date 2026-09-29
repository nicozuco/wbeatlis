import { AgendaWorkspace, type AgendaView } from "@/components/agenda/agenda-workspace";
import { dayKey, isDayKey } from "@/lib/agenda";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const views: AgendaView[] = ["day", "week", "month", "content", "formation"];

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ dia?: string; vista?: string }> }) {
  const { dia, vista } = await searchParams;
  const today = dayKey(new Date());
  const [reminders, tasks, followUps, contentItems, clinics] = await Promise.all([
    prisma.reminder.findMany({ orderBy: { remindAt: "asc" } }),
    prisma.task.findMany({ where: { dueAt: { not: null } }, include: { clinic: { select: { name: true } } }, orderBy: { dueAt: "asc" } }),
    prisma.clinic.findMany({ where: { nextFollowUpAt: { not: null }, phase: { not: "DISCARDED" } }, select: { id: true, name: true, phase: true, nextFollowUpAt: true } }),
    prisma.contentItem.findMany({ orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }] }),
    prisma.clinic.findMany({ select: { id: true, name: true, phase: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AgendaWorkspace
      today={today}
      initialDay={isDayKey(dia) ? dia : today}
      initialView={views.includes(vista as AgendaView) ? (vista as AgendaView) : "day"}
      reminders={reminders.map((reminder) => ({ id: reminder.id, title: reminder.title, notes: reminder.notes, remindAt: reminder.remindAt.toISOString(), sentAt: reminder.sentAt?.toISOString() ?? null, doneAt: reminder.doneAt?.toISOString() ?? null }))}
      tasks={tasks.map((task) => ({ id: task.id, title: task.title, description: task.description, category: task.category, priority: task.priority, status: task.status, dueAt: task.dueAt?.toISOString() ?? null, clinicId: task.clinicId, clinicName: task.clinic?.name ?? null, blocksPhase: task.blocksPhase }))}
      followUps={followUps.map((clinic) => ({ id: clinic.id, name: clinic.name, phase: clinic.phase, nextFollowUpAt: clinic.nextFollowUpAt!.toISOString() }))}
      contentItems={contentItems.map((item) => ({ id: item.id, title: item.title, format: item.format, status: item.status, scheduledFor: item.scheduledFor?.toISOString() ?? null, script: item.script }))}
      clinics={clinics}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
    />
  );
}
