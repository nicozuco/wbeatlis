import { getAuthenticatedUser } from "@/lib/auth";
import { GOAL_ATTACHMENT_BUCKET } from "@/lib/goal-attachments";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function getAttachment(context: Context) {
  const { id } = await context.params;
  if (!id || id.length > 100) return null;
  return prisma.goalStepAttachment.findUnique({ where: { id } });
}

export async function GET(request: Request, context: Context) {
  if (!await getAuthenticatedUser()) return new Response("Tu sesión ha caducado.", { status: 401 });
  const attachment = await getAttachment(context);
  if (!attachment) return new Response("Archivo no encontrado.", { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(GOAL_ATTACHMENT_BUCKET).download(attachment.storagePath);
  if (error || !data) return new Response("No se pudo abrir el archivo.", { status: 502 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const encodedName = encodeURIComponent(attachment.name);
  const headers = new Headers({
    "Content-Type": attachment.contentType === "text/plain" ? "text/plain; charset=utf-8" : attachment.contentType,
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="document"; filename*=UTF-8''${encodedName}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (attachment.contentType === "text/html") {
    headers.set("Content-Security-Policy", "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
  }
  return new Response(data, { headers });
}

export async function DELETE(_request: Request, context: Context) {
  if (!await getAuthenticatedUser()) return Response.json({ error: "Tu sesión ha caducado. Vuelve a iniciar sesión." }, { status: 401 });
  const attachment = await getAttachment(context);
  if (!attachment) return Response.json({ error: "Archivo no encontrado." }, { status: 404 });

  const supabase = await createClient();
  const { error } = await supabase.storage.from(GOAL_ATTACHMENT_BUCKET).remove([attachment.storagePath]);
  if (error) return Response.json({ error: "No se pudo eliminar el archivo." }, { status: 502 });

  await prisma.goalStepAttachment.delete({ where: { id: attachment.id } });
  return Response.json({ ok: true });
}
