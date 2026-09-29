import { GoalsWorkspace } from "@/components/goals/goals-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const goals = await prisma.goal.findMany({
    include: {
      sections: {
        include: { steps: { include: { attachments: { orderBy: { createdAt: "asc" } } }, orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { position: "asc" },
  });

  return (
    <GoalsWorkspace
      goals={goals.map((goal) => ({
        id: goal.id,
        slug: goal.slug,
        title: goal.title,
        description: goal.description,
        sections: goal.sections.map((section) => ({
          id: section.id,
          title: section.title,
          description: section.description,
          steps: section.steps.map((step) => ({
            id: step.id,
            title: step.title,
            description: step.description,
            answer: step.answer,
            attachments: step.attachments.map((attachment) => ({ id: attachment.id, name: attachment.name, contentType: attachment.contentType, size: attachment.size })),
            referenceUrl: step.referenceUrl,
            completedAt: step.completedAt?.toISOString() ?? null,
          })),
        })),
      }))}
    />
  );
}
