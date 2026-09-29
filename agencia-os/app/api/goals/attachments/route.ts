import { getAuthenticatedUser } from "@/lib/auth";
import { GOAL_ATTACHMENT_BUCKET, GOAL_ATTACHMENT_MAX_BYTES, GOAL_ATTACHMENT_MAX_PER_STEP, getGoalAttachmentFormat, goalAttachmentDisplayName, isGoalAttachmentSignatureValid } from "@/lib/goal-attachments";
import { hasGoalStepField } from "@/lib/goal-step-fields";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!await getAuthenticatedUser()) return Response.json({ error: "Tu sesión ha caducado. Vuelve a iniciar sesión." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const stepId = form?.get("stepId");
  const file = form?.get("file");
  if (typeof stepId !== "string" || !hasGoalStepField(stepId)) return Response.json({ error: "Este paso no admite adjuntos." }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "Selecciona un archivo." }, { status: 400 });

  const name = goalAttachmentDisplayName(file.name);
  const format = getGoalAttachmentFormat(name);
  if (!name || !format) return Response.json({ error: "Formato no admitido. Usa PDF, HTML, TXT, MD, PNG, JPG o WebP." }, { status: 415 });
  if (file.size === 0 || file.size > GOAL_ATTACHMENT_MAX_BYTES) return Response.json({ error: "El archivo debe ocupar entre 1 byte y 4 MB." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isGoalAttachmentSignatureValid(bytes, format.extension)) return Response.json({ error: "El contenido no coincide con el formato del archivo." }, { status: 415 });

  const step = await prisma.goalStep.findUnique({ where: { id: stepId }, select: { id: true, _count: { select: { attachments: true } } } });
  if (!step) return Response.json({ error: "El paso del objetivo no existe." }, { status: 404 });
  if (step._count.attachments >= GOAL_ATTACHMENT_MAX_PER_STEP) return Response.json({ error: "Cada respuesta admite como máximo 10 archivos." }, { status: 409 });

  const path = `${stepId}/${crypto.randomUUID()}.${format.extension}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage.from(GOAL_ATTACHMENT_BUCKET).upload(path, bytes, {
    contentType: format.contentType,
    upsert: false,
  });
  if (uploadError) return Response.json({ error: "No se pudo subir el archivo. Inténtalo de nuevo." }, { status: 502 });

  try {
    const attachment = await prisma.goalStepAttachment.create({ data: {
      stepId, name, contentType: format.contentType, size: file.size, storagePath: path,
    }, select: { id: true, name: true, contentType: true, size: true } });
    return Response.json({ attachment }, { status: 201 });
  } catch {
    await supabase.storage.from(GOAL_ATTACHMENT_BUCKET).remove([path]);
    return Response.json({ error: "No se pudo vincular el archivo con la respuesta." }, { status: 500 });
  }
}
