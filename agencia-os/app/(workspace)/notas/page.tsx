import { NotesWorkspace } from "@/components/notes/notes-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await prisma.note.findMany({ include: { tags: true }, orderBy: { updatedAt: "desc" } });
  return <NotesWorkspace notes={notes.map((note) => ({ id: note.id, title: note.title, body: note.body, updatedAt: note.updatedAt.toISOString(), tags: note.tags.map((tag) => tag.name) }))} />;
}
