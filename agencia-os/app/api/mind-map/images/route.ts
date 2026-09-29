import { getAuthenticatedUser } from "@/lib/auth";
import { MIND_MAP_IMAGE_BUCKET } from "@/lib/mind-map-style";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

// Sube una imagen pegada, arrastrada o elegida en el mapa mental al bucket
// mind-map-images con la sesión de quien la sube (las políticas de Storage solo
// dejan escribir a usuarios autenticados). Es una ruta y no una server action
// para no chocar con el límite de tamaño del cuerpo de las acciones.
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: "Tu sesión ha caducado. Vuelve a iniciar sesión." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No se ha recibido ninguna imagen" }, { status: 400 });
  const extension = EXTENSIONS[file.type];
  if (!extension) return Response.json({ error: "Formato no admitido. Usa PNG, JPG, WebP o GIF." }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "La imagen supera los 10 MB" }, { status: 413 });

  const supabase = await createClient();
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(MIND_MAP_IMAGE_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return Response.json({ error: "No se pudo subir la imagen" }, { status: 502 });

  const { data } = supabase.storage.from(MIND_MAP_IMAGE_BUCKET).getPublicUrl(path);
  return Response.json({ src: data.publicUrl, path });
}
