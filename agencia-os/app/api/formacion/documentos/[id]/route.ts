import { getAuthenticatedUser } from "@/lib/auth";
import { getFormationDocument } from "@/lib/formation-library";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAuthenticatedUser()) return new Response("Tu sesión ha caducado.", { status: 401 });
  const { id } = await context.params;
  const document = id && id.length <= 300 ? await getFormationDocument(id) : null;
  if (!document) return new Response("Documento no encontrado.", { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.contentType,
      "Content-Length": String(document.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="document"; filename*=UTF-8''${encodeURIComponent(document.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
