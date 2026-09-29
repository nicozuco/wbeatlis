import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LIVE_WINDOW_MS, type LiveVisitor } from "@/lib/site-analytics";

export const dynamic = "force-dynamic";

// Personas con una pestaña abierta ahora mismo en las webs públicas. La consulta
// la vista Analítica → Web cada 15 segundos.
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });
  const rows = await prisma.siteSession.findMany({
    where: { lastSeenAt: { gte: new Date(Date.now() - LIVE_WINDOW_MS) } },
    orderBy: { lastSeenAt: "desc" },
    take: 100,
    select: { site: true, currentPath: true, source: true, device: true, city: true, lastSeenAt: true },
  });
  const visitors: LiveVisitor[] = rows.map((row) => ({ ...row, lastSeenAt: row.lastSeenAt.toISOString() }));
  return Response.json({ visitors }, { headers: { "Cache-Control": "no-store" } });
}
