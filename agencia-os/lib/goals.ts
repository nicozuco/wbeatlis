export function goalProgress(steps: ReadonlyArray<{ completedAt: string | Date | null }>) {
  const completed = steps.filter((step) => Boolean(step.completedAt)).length;
  const total = steps.length;
  return { completed, total, remaining: total - completed, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
}
