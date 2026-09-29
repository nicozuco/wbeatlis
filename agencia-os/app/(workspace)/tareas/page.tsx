import { TasksWorkspace } from "@/components/tasks/tasks-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, clinics] = await Promise.all([
    prisma.task.findMany({ include: { clinic: true }, orderBy: [{ status: "asc" }, { dueAt: "asc" }] }),
    prisma.clinic.findMany({ select: { id: true, name: true, phase: true }, orderBy: { name: "asc" } }),
  ]);
  return <TasksWorkspace clinics={clinics} tasks={tasks.map((task) => ({ id: task.id, title: task.title, description: task.description, category: task.category, priority: task.priority, status: task.status, dueAt: task.dueAt?.toISOString() ?? null, clinicId: task.clinicId, clinicName: task.clinic?.name ?? null, blocksPhase: task.blocksPhase }))} />;
}
