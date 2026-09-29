import { CompetitorsWorkspace } from "@/components/competitors/competitors-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const competitors = await prisma.competitor.findMany({ orderBy: [{ ranking: "asc" }, { company: "asc" }] });
  const reviewCutoff = new Date();
  reviewCutoff.setDate(reviewCutoff.getDate() - 30);
  const reviewedRecently = competitors.filter((item) => item.lastReviewedAt && item.lastReviewedAt > reviewCutoff).length;
  return <CompetitorsWorkspace reviewedRecently={reviewedRecently} competitors={competitors.map((item) => ({ ...item, lastReviewedAt: item.lastReviewedAt?.toISOString() ?? null, createdAt: undefined, updatedAt: undefined }))} />;
}
